import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PaymentStatus, SessionStatus } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { PrismaService } from "../prisma/prisma.service";
import { KENYAN_E164_RE, toKenyanE164 } from "../common/utils/phone.util";
import { DarajaService } from "./daraja/daraja.service";
import {
  amountsMatch,
  isStkCallbackSuccess,
  parseStkCallbackBody,
  verifyWebhookSignature,
} from "./daraja/daraja.sdk";
import { MikroTikService } from "../mikrotik/mikrotik.service";
import { InitiatePaymentDto } from "./dto/initiate-payment.dto";
import type { StkCallbackBody } from "./daraja/daraja.types";

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly daraja: DarajaService,
    private readonly mikrotik: MikroTikService,
    private readonly config: ConfigService,
  ) {}

  private resolvePayPhone(dtoPhone: string | undefined, userPhone: string): string {
    const raw = dtoPhone ?? userPhone;
    const normalized = toKenyanE164(raw);
    if (typeof normalized !== "string" || !KENYAN_E164_RE.test(normalized)) {
      throw new HttpException("Phone required for payment", HttpStatus.BAD_REQUEST);
    }
    return normalized;
  }

  private async findIdempotentInitiate(
    userId: string,
    idempotencyKey: string,
  ): Promise<{ checkoutRequestId: string; message: string } | null> {
    const existing = await this.prisma.payment.findUnique({
      where: { idempotencyKey },
    });
    if (!existing || existing.userId !== userId) return null;

    if (existing.status === PaymentStatus.FAILED) {
      await this.prisma.payment.delete({ where: { id: existing.id } });
      return null;
    }

    if (existing.checkoutRequestId) {
      return {
        checkoutRequestId: existing.checkoutRequestId,
        message: "STK Push sent. Enter M-Pesa PIN.",
      };
    }
    return null;
  }

  async initiate(
    userId: string,
    userPhone: string,
    dto: InitiatePaymentDto,
    idempotencyKey?: string,
  ) {
    if (idempotencyKey) {
      const cached = await this.findIdempotentInitiate(userId, idempotencyKey);
      if (cached) return cached;
    }

    const plan = await this.prisma.plan.findUnique({ where: { id: dto.planId } });
    if (!plan?.isActive) {
      throw new HttpException("Invalid or inactive plan", HttpStatus.BAD_REQUEST);
    }

    const payPhone = this.resolvePayPhone(dto.phone, userPhone);
    const amount = Number(plan.price);

    const recent = await this.prisma.payment.findFirst({
      where: {
        macAddress: dto.macAddress,
        status: PaymentStatus.PENDING,
        createdAt: { gte: new Date(Date.now() - 120_000) },
      },
    });
    if (recent) {
      throw new ConflictException("Payment already pending");
    }

    const payment = await this.prisma.payment.create({
      data: {
        userId,
        planId: plan.id,
        macAddress: dto.macAddress,
        amount: new Decimal(amount),
        status: PaymentStatus.PENDING,
        idempotencyKey: idempotencyKey ?? null,
      },
    });

    let stk: { checkoutRequestId: string; merchantRequestId: string };
    try {
      stk = await this.daraja.stkPush(amount, payPhone, plan.id);
    } catch (e) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED },
      });
      if (e instanceof HttpException) throw e;
      throw new HttpException("Payment gateway unavailable", HttpStatus.SERVICE_UNAVAILABLE);
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { checkoutRequestId: stk.checkoutRequestId },
    });

    return {
      checkoutRequestId: stk.checkoutRequestId,
      message: "STK Push sent. Enter M-Pesa PIN.",
    };
  }

  private async provisionSession(
    paymentId: string,
    userId: string,
    planId: string,
    macAddress: string,
    durationHours: number,
    speedLimit: string,
  ): Promise<void> {
    const extensionMs = durationHours * 60 * 60 * 1000;
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({ where: { id: paymentId } });
      if (!payment || payment.provisionedAt) return;

      const existing = await tx.session.findFirst({
        where: {
          userId,
          macAddress,
          status: SessionStatus.ACTIVE,
          expiresAt: { gt: now },
        },
      });

      if (existing) {
        await tx.session.update({
          where: { id: existing.id },
          data: { expiresAt: new Date(existing.expiresAt.getTime() + extensionMs) },
        });
      } else {
        await tx.session.create({
          data: {
            userId,
            planId,
            macAddress,
            status: SessionStatus.ACTIVE,
            expiresAt: new Date(now.getTime() + extensionMs),
          },
        });
      }

      await tx.payment.update({
        where: { id: paymentId },
        data: { provisionedAt: now },
      });
    });

    await this.mikrotik.connectUser(macAddress, speedLimit);
  }

  async handleStkCallback(
    raw: StkCallbackBody,
    context: { requestIp: string; signature?: string; rawBody?: string },
  ): Promise<void> {
    if (!this.validateWebhookSource(context.requestIp, context.signature, context.rawBody)) {
      this.logger.warn(`Webhook rejected source ip=${context.requestIp}`);
      return;
    }

    const parsed = parseStkCallbackBody(raw);
    if (!parsed) {
      this.logger.warn("No stkCallback in body");
      return;
    }

    const payment = await this.prisma.payment.findUnique({
      where: { checkoutRequestId: parsed.checkoutRequestId },
      include: { plan: true },
    });
    if (!payment) {
      this.logger.warn(`Payment not found for ${parsed.checkoutRequestId}`);
      return;
    }

    if (payment.status === PaymentStatus.SUCCESS && payment.provisionedAt) {
      this.logger.debug(`Ignoring duplicate callback for ${parsed.checkoutRequestId}`);
      return;
    }

    if (!isStkCallbackSuccess(parsed.resultCode)) {
      await this.prisma.payment.updateMany({
        where: { id: payment.id, status: PaymentStatus.PENDING },
        data: { status: PaymentStatus.FAILED },
      });
      return;
    }

    const expectedAmount = Number(payment.amount);
    if (!amountsMatch(expectedAmount, parsed.metadata.amount)) {
      this.logger.warn(
        `Amount mismatch for ${parsed.checkoutRequestId}: expected=${expectedAmount} received=${parsed.metadata.amount}`,
      );
      await this.prisma.payment.updateMany({
        where: { id: payment.id, status: PaymentStatus.PENDING },
        data: { status: PaymentStatus.FAILED },
      });
      return;
    }

    if (!payment.provisionedAt) {
      try {
        await this.provisionSession(
          payment.id,
          payment.userId,
          payment.planId,
          payment.macAddress,
          payment.plan.durationHours,
          payment.plan.speedLimit,
        );
      } catch (e) {
        this.logger.error(
          `Provisioning failed for ${parsed.checkoutRequestId}`,
          e instanceof Error ? e.stack : e,
        );
        return;
      }
    }

    await this.prisma.payment.updateMany({
      where: { id: payment.id, status: { not: PaymentStatus.SUCCESS } },
      data: {
        status: PaymentStatus.SUCCESS,
        mpesaReceiptNumber: parsed.metadata.mpesaReceiptNumber ?? null,
      },
    });

  }

  private normalizeIp(ip: string): string {
    if (!ip) return "";
    const candidate = ip.trim();
    if (candidate.startsWith("::ffff:")) return candidate.slice(7);
    return candidate;
  }

  private ipv4ToInt(ipv4: string): number | null {
    const parts = ipv4.split(".");
    if (parts.length !== 4) return null;
    const nums = parts.map((p) => Number(p));
    if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null;
    return (((nums[0] ?? 0) << 24) >>> 0) + ((nums[1] ?? 0) << 16) + ((nums[2] ?? 0) << 8) + (nums[3] ?? 0);
  }

  private ipInCidr(ip: string, cidr: string): boolean {
    const [base, prefixRaw] = cidr.split("/");
    const prefix = Number(prefixRaw);
    if (!base || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) return false;
    const ipInt = this.ipv4ToInt(ip);
    const baseInt = this.ipv4ToInt(base);
    if (ipInt === null || baseInt === null) return false;
    const mask = prefix === 0 ? 0 : (~((1 << (32 - prefix)) - 1) >>> 0);
    return (ipInt & mask) === (baseInt & mask);
  }

  private isIpAllowed(ip: string): boolean {
    const cidrs = (this.config.get<string>("DARAJA_ALLOWED_CIDRS") ?? "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    if (!cidrs.length) return false;
    const normalized = this.normalizeIp(ip);
    for (const cidr of cidrs) {
      if (this.ipInCidr(normalized, cidr)) return true;
    }
    return false;
  }

  private validateWebhookSource(ip: string, signature?: string, rawBody?: string): boolean {
    const bypass = this.config.get<string>("DARAJA_WEBHOOK_BYPASS") === "true";
    if (bypass) {
      this.logger.warn("DARAJA_WEBHOOK_BYPASS is enabled; webhook verification is relaxed");
      return true;
    }

    const secret = this.config.get<string>("DARAJA_WEBHOOK_SECRET") ?? "";
    const ipAllowed = this.isIpAllowed(ip);
    const signatureValid = verifyWebhookSignature(secret, signature, rawBody);
    return ipAllowed || signatureValid;
  }

  async history(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { plan: { select: { name: true, durationHours: true } } },
    });
  }
}
