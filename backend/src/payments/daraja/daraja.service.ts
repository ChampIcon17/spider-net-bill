import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RedisService } from "../../redis/redis.service";
import type { DarajaOAuthResponse, StkPushResponse } from "./daraja.types";

@Injectable()
export class DarajaService {
  private readonly logger = new Logger(DarajaService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {}

  private baseUrl(): string {
    return this.config.get<string>("MPESA_ENV") === "production"
      ? "https://api.safaricom.co.ke"
      : "https://sandbox.safaricom.co.ke";
  }

  async getOAuthToken(): Promise<string> {
    const cached = await this.redis.getClient().get("daraja:oauth");
    if (cached) return cached;

    const key = this.config.get<string>("MPESA_CONSUMER_KEY")!;
    const secret = this.config.get<string>("MPESA_CONSUMER_SECRET")!;
    const auth = Buffer.from(`${key}:${secret}`).toString("base64");
    const url = `${this.baseUrl()}/oauth/v1/generate?grant_type=client_credentials`;
    const res = await fetch(url, { headers: { Authorization: `Basic ${auth}` } });
    if (!res.ok) {
      this.logger.error(`Daraja OAuth failed ${res.status}`);
      throw new HttpException("Payment gateway unavailable", HttpStatus.SERVICE_UNAVAILABLE);
    }
    const json = (await res.json()) as DarajaOAuthResponse;
    const token = json.access_token;
    await this.redis.getClient().set("daraja:oauth", token, "EX", 3540);
    return token;
  }

  private stkPassword(timestamp: string): string {
    const shortCode = this.config.get<string>("MPESA_SHORTCODE")!;
    const passkey = this.config.get<string>("MPESA_PASSKEY")!;
    return Buffer.from(`${shortCode}${passkey}${timestamp}`).toString("base64");
  }

  private formatTimestamp(): string {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  }

  /** phoneDigits: 2547XXXXXXXX */
  async stkPush(amount: number, phoneDigits: string, accountRef: string): Promise<StkPushResponse> {
    const token = await this.getOAuthToken();
    const timestamp = this.formatTimestamp();
    const shortCode = this.config.get<string>("MPESA_SHORTCODE")!;
    const callback = this.config.get<string>("MPESA_CALLBACK_URL")!;
    const url = `${this.baseUrl()}/mpesa/stkpush/v1/processrequest`;
    const body = {
      BusinessShortCode: shortCode,
      Password: this.stkPassword(timestamp),
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(amount),
      PartyA: phoneDigits,
      PartyB: shortCode,
      PhoneNumber: phoneDigits,
      CallBackURL: callback,
      AccountReference: accountRef,
      TransactionDesc: "WiFi billing",
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const json = (await res.json()) as StkPushResponse & {
      errorCode?: string;
      errorMessage?: string;
    };

    const codeOk = String((json as { ResponseCode?: string | number }).ResponseCode ?? "") === "0";
    if (!res.ok || !codeOk) {
      this.logger.warn(`STK Push error: ${JSON.stringify(json)}`);
      throw new HttpException("Payment gateway unavailable", HttpStatus.SERVICE_UNAVAILABLE);
    }
    return json;
  }
}
