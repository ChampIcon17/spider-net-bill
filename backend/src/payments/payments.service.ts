import { ConflictException, HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PaymentStatus, SessionStatus } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { createHmac, timingSafeEqual } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import { DarajaService } from "./daraja/daraja.service";
import { MikroTikService } from "../mikrotik/mikrotik.service";
import { InitiatePaymentDto } from "./dto/initiate-payment.dto";
import type { StkCallbackBody } from "./daraja/daraja.types";

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly daraja: DarajaService,
    private readonly mikrotik: MikroTikService,
    private readonly config: ConfigService,
  ) {}

  private toPartyA(e164: string): string {
    return e164.replace(/^\+/, "");
  }

  async initiate(userId: string, userPhone: string, dto: InitiatePaymentDto) {
    const plan = await this.prisma.plan.findUnique({ where: { id: dto.planId } });
    if (!plan?.isActive) {
      throw new HttpException("Invalid or inactive plan", HttpStatus.BAD_REQUEST);
    }

    const active = await this.prisma.session.findFirst({
      where: {
        userId,
        macAddress: dto.macAddress,
        status: SessionStatus.ACTIVE,
        expiresAt: { gt: new Date() },
      },
    });
    if (active) {
      throw new ConflictException("Already connected for this device");
    }

    const payPhone = dto.phone ?? userPhone;
    if (!payPhone?.startsWith("+254")) {
      throw new HttpException("Phone required for payment", HttpStatus.BAD_REQUEST);
    }

    const amount = Number(plan.price);
    let stk;
    try {
      stk = await this.daraja.stkPush(amount, this.toPartyA(payPhone), `plan:${plan.id}`);
    } catch (e) {
      if (e instanceof HttpException) throw e;
      throw new HttpException("Payment gateway unavailable", HttpStatus.SERVICE_UNAVAILABLE);
    }

    const checkoutRequestId = stk.CheckoutRequestID;
    await this.prisma.payment.create({
      data: {
        userId,
        planId: plan.id,
        amount: new Decimal(amount),
        checkoutRequestId,
        status: PaymentStatus.PENDING,
      },
    });

    const payload = JSON.stringify({ userId, planId: plan.id, macAddress: dto.macAddress });
    await this.redis.getClient().set(`payment:pending:${checkoutRequestId}`, payload, "EX", 300);

    return {
      checkoutRequestId,
      message: "STK Push sent. Enter M-Pesa PIN.",
    };
  }

  async handleStkCallback(
    raw: StkCallbackBody,
    context: { requestIp: string; signature?: string; rawBody?: string },
  ): Promise<void> {
    if (!this.validateWebhookSource(context.requestIp, context.signature, context.rawBody)) {
      this.logger.warn(`Webhook rejected source ip=${context.requestIp}`);
      return;
    }

    const cb = raw.Body?.stkCallback;
    if (!cb) {
      this.logger.warn("No stkCallback in body");
      return;
    }

    const checkoutRequestId = cb.CheckoutRequestID;
    const payment = await this.prisma.payment.findUnique({
      where: { checkoutRequestId },
      include: { plan: true },
    });
    if (!payment) {
      this.logger.warn(`Payment not found for ${checkoutRequestId}`);
      return;
    }

    if (payment.status === PaymentStatus.SUCCESS) {
      this.logger.debug(`Ignoring duplicate callback for ${checkoutRequestId}`);
      return;
    }

    if (cb.ResultCode !== 0) {
      await this.prisma.payment.updateMany({
        where: { id: payment.id, status: PaymentStatus.PENDING },
        data: { status: PaymentStatus.FAILED },
      });
      return;
    }

    const items = cb.CallbackMetadata?.Item ?? [];
    let mpesaReceipt = "";
    for (const it of items) {
      if (it.Name === "MpesaReceiptNumber") {
        mpesaReceipt = String(it.Value ?? "");
      }
    }

    const updateResult = await this.prisma.payment.updateMany({
      where: { id: payment.id, status: { not: PaymentStatus.SUCCESS } },
      data: {
        status: PaymentStatus.SUCCESS,
        mpesaReceiptNumber: mpesaReceipt || null,
      },
    });
    if (updateResult.count === 0) {
      this.logger.debug(`Payment already processed for ${checkoutRequestId}`);
      return;
    }

    const pendingRaw = await this.redis.getClient().get(`payment:pending:${checkoutRequestId}`);
    if (!pendingRaw) {
      this.logger.warn(`No pending payment context for ${checkoutRequestId}`);
      return;
    }
    let pending: { userId: string; planId: string; macAddress: string };
    try {
      pending = JSON.parse(pendingRaw) as typeof pending;
    } catch {
      return;
    }

    const plan = payment.plan;
    const expiresAt = new Date(Date.now() + plan.durationHours * 60 * 60 * 1000);
    const existing = await this.prisma.session.findFirst({
      where: {
        userId: pending.userId,
        macAddress: pending.macAddress,
        status: SessionStatus.ACTIVE,
        expiresAt: { gt: new Date() },
      },
    });
    if (existing) {
      this.logger.warn(`Active session already exists for mac=${pending.macAddress}`);
      await this.redis.getClient().del(`payment:pending:${checkoutRequestId}`);
      return;
    }

    await this.prisma.session.create({
      data: {
        userId: pending.userId,
        planId: plan.id,
        macAddress: pending.macAddress,
        status: SessionStatus.ACTIVE,
        expiresAt,
      },
    });

    await this.mikrotik.connectUser(pending.macAddress, plan.speedLimit);
    await this.redis.getClient().del(`payment:pending:${checkoutRequestId}`);
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

  private isSignatureValid(signature: string | undefined, rawBody: string | undefined): boolean {
    const secret = this.config.get<string>("DARAJA_WEBHOOK_SECRET") ?? "";
    if (!secret) return false;
    if (!signature || !rawBody) return false;
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    const incoming = signature.toLowerCase();
    const expectedBuf = Buffer.from(expected);
    const incomingBuf = Buffer.from(incoming);
    if (expectedBuf.length !== incomingBuf.length) return false;
    return timingSafeEqual(expectedBuf, incomingBuf);
  }

  private validateWebhookSource(ip: string, signature?: string, rawBody?: string): boolean {
    const bypass = this.config.get<string>("DARAJA_WEBHOOK_BYPASS") === "true";
    if (bypass) {
      this.logger.warn("DARAJA_WEBHOOK_BYPASS is enabled; webhook verification is relaxed");
      return true;
    }

    const ipAllowed = this.isIpAllowed(ip);
    const signatureValid = this.isSignatureValid(signature, rawBody);
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
