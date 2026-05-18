import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RedisService } from "../../redis/redis.service";
import { DarajaClient, type DarajaClientConfig } from "./daraja.client";
import { DarajaSdk } from "./daraja.sdk";

@Injectable()
export class DarajaService {
  private readonly logger = new Logger(DarajaService.name);
  private readonly sdk: DarajaSdk;

  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {
    this.sdk = new DarajaSdk(this.clientConfig(), () => this.getOAuthToken());
  }

  private baseUrl(): string {
    return this.config.get<string>("MPESA_ENV") === "production"
      ? "https://api.safaricom.co.ke"
      : "https://sandbox.safaricom.co.ke";
  }

  private clientConfig(): DarajaClientConfig {
    return {
      baseUrl: this.baseUrl(),
      consumerKey: this.config.get<string>("MPESA_CONSUMER_KEY")!,
      consumerSecret: this.config.get<string>("MPESA_CONSUMER_SECRET")!,
      shortCode: this.config.get<string>("MPESA_SHORTCODE")!,
      passkey: this.config.get<string>("MPESA_PASSKEY")!,
      callbackUrl: this.config.get<string>("MPESA_CALLBACK_URL")!,
    };
  }

  async getOAuthToken(): Promise<string> {
    const cached = await this.redis.getClient().get("daraja:oauth");
    if (cached) return cached;

    const client = new DarajaClient(this.clientConfig());
    try {
      const token = await client.fetchOAuthToken();
      await this.redis.getClient().set("daraja:oauth", token, "EX", 3540);
      return token;
    } catch (e) {
      this.logger.error(`Daraja OAuth failed: ${e instanceof Error ? e.message : e}`);
      throw new HttpException("Payment gateway unavailable", HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  async stkPush(
    amount: number,
    phoneE164: string,
    planId: string,
  ): Promise<{ checkoutRequestId: string; merchantRequestId: string }> {
    try {
      return await this.sdk.initiateStkPush({ amount, phoneE164, planId });
    } catch (e) {
      this.logger.warn(`STK Push error: ${e instanceof Error ? e.message : e}`);
      throw new HttpException("Payment gateway unavailable", HttpStatus.SERVICE_UNAVAILABLE);
    }
  }
}
