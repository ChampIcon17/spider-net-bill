import type { DarajaOAuthResponse, StkPushResponse } from "./daraja.types";

export type DarajaClientConfig = {
  baseUrl: string;
  consumerKey: string;
  consumerSecret: string;
  shortCode: string;
  passkey: string;
  callbackUrl: string;
};

export type StkPushParams = {
  amount: number;
  phoneDigits: string;
  accountReference: string;
  transactionDesc: string;
  accessToken: string;
};

export class DarajaClient {
  constructor(private readonly config: DarajaClientConfig) {}

  async fetchOAuthToken(): Promise<string> {
    const auth = Buffer.from(`${this.config.consumerKey}:${this.config.consumerSecret}`).toString("base64");
    const url = `${this.config.baseUrl}/oauth/v1/generate?grant_type=client_credentials`;
    const res = await fetch(url, { headers: { Authorization: `Basic ${auth}` } });
    if (!res.ok) {
      throw new Error(`Daraja OAuth failed: HTTP ${res.status}`);
    }
    const json = (await res.json()) as DarajaOAuthResponse;
    if (!json.access_token) {
      throw new Error("Daraja OAuth response missing access_token");
    }
    return json.access_token;
  }

  buildStkPassword(timestamp: string): string {
    return Buffer.from(`${this.config.shortCode}${this.config.passkey}${timestamp}`).toString("base64");
  }

  formatTimestamp(date = new Date()): string {
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  }

  async stkPush(params: StkPushParams): Promise<StkPushResponse> {
    const timestamp = this.formatTimestamp();
    const url = `${this.config.baseUrl}/mpesa/stkpush/v1/processrequest`;
    const body = {
      BusinessShortCode: this.config.shortCode,
      Password: this.buildStkPassword(timestamp),
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(params.amount),
      PartyA: params.phoneDigits,
      PartyB: this.config.shortCode,
      PhoneNumber: params.phoneDigits,
      CallBackURL: this.config.callbackUrl,
      AccountReference: params.accountReference,
      TransactionDesc: params.transactionDesc,
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
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
      throw new Error(`Daraja STK push failed: ${JSON.stringify(json)}`);
    }
    if (!json.CheckoutRequestID) {
      throw new Error("Daraja STK push response missing CheckoutRequestID");
    }
    return json;
  }
}
