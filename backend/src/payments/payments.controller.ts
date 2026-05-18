import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Logger,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import type { RequestUser } from "../common/decorators/current-user.decorator";
import { PaymentsService } from "./payments.service";
import { InitiatePaymentDto } from "./dto/initiate-payment.dto";
import type { Request } from "express";
import type { StkCallbackBody } from "./daraja/daraja.types";

type RequestWithRawBody = Request & { rawBody?: Buffer };

@Controller("payments")
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly payments: PaymentsService) {}

  @Post("initiate")
  @HttpCode(202)
  @UseGuards(JwtAuthGuard)
  initiate(
    @CurrentUser() user: RequestUser,
    @Body() dto: InitiatePaymentDto,
    @Headers("idempotency-key") idempotencyKey?: string,
  ) {
    return this.payments.initiate(user.sub, user.phone, dto, idempotencyKey);
  }

  @Post("webhook")
  @SkipThrottle()
  @HttpCode(200)
  async webhook(@Body() body: StkCallbackBody, @Req() req: RequestWithRawBody) {
    try {
      const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.ip ?? "";
      const signatureHeader =
        (req.headers["x-daraja-signature"] as string | undefined) ??
        (req.headers["x-callback-signature"] as string | undefined);
      const rawBody = req.rawBody?.toString("utf8") ?? JSON.stringify(body);
      await this.payments.handleStkCallback(body, {
        requestIp: ip,
        signature: signatureHeader,
        rawBody,
      });
    } catch (e) {
      this.logger.error("webhook internal error", e instanceof Error ? e.stack : e);
    }
    return { ResultCode: 0, ResultDesc: "Accepted" };
  }

  @Get("history")
  @UseGuards(JwtAuthGuard)
  history(@CurrentUser() user: RequestUser) {
    return this.payments.history(user.sub);
  }
}
