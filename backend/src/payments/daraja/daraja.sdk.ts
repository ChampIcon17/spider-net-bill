import { createHmac, timingSafeEqual } from "crypto";
import { DarajaClient, type DarajaClientConfig } from "./daraja.client";
import type { StkCallbackItem, StkCallbackBody } from "./daraja.types";

export const DARAJA_ACCOUNT_REF_MAX = 12;
export const DARAJA_TRANSACTION_DESC_MAX = 13;

export type StkCallbackMetadata = {
  amount: number | null;
  mpesaReceiptNumber: string | null;
  phoneNumber: string | null;
};

export function toDarajaPhoneDigits(e164: string): string {
  return e164.replace(/^\+/, "");
}

/** Safaricom AccountReference allows max 12 alphanumeric characters. */
export function buildAccountReference(planId: string): string {
  const compact = planId.replace(/-/g, "").toUpperCase();
  return compact.slice(0, DARAJA_ACCOUNT_REF_MAX);
}

export function parseStkCallbackMetadata(items: StkCallbackItem[]): StkCallbackMetadata {
  const find = (name: string) => items.find((i) => i.Name === name);
  const amountItem = find("Amount");
  const receiptItem = find("MpesaReceiptNumber");
  const phoneItem = find("PhoneNumber");
  return {
    amount: amountItem?.Value != null ? Number(amountItem.Value) : null,
    mpesaReceiptNumber: receiptItem?.Value != null ? String(receiptItem.Value) : null,
    phoneNumber: phoneItem?.Value != null ? String(phoneItem.Value) : null,
  };
}

export function isStkCallbackSuccess(resultCode: number | string | undefined): boolean {
  return Number(resultCode) === 0;
}

export function amountsMatch(expected: number, received: number | null): boolean {
  if (received == null || !Number.isFinite(received)) return false;
  return Math.round(expected * 100) === Math.round(received * 100);
}

export function verifyWebhookSignature(
  secret: string,
  signature: string | undefined,
  rawBody: string | undefined,
): boolean {
  if (!secret || !signature || !rawBody) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const incoming = signature.toLowerCase();
  const expectedBuf = Buffer.from(expected);
  const incomingBuf = Buffer.from(incoming);
  if (expectedBuf.length !== incomingBuf.length) return false;
  return timingSafeEqual(expectedBuf, incomingBuf);
}

export type ParsedStkCallback = {
  checkoutRequestId: string;
  resultCode: number;
  resultDesc: string;
  metadata: StkCallbackMetadata;
};

export function parseStkCallbackBody(body: StkCallbackBody): ParsedStkCallback | null {
  const cb = body.Body?.stkCallback;
  if (!cb?.CheckoutRequestID) return null;
  const items = cb.CallbackMetadata?.Item ?? [];
  return {
    checkoutRequestId: cb.CheckoutRequestID,
    resultCode: Number(cb.ResultCode),
    resultDesc: cb.ResultDesc ?? "",
    metadata: parseStkCallbackMetadata(items),
  };
}

/**
 * Thin SDK over Daraja HTTP — inject DarajaClient in tests with a mock.
 */
export class DarajaSdk {
  private readonly client: DarajaClient;

  constructor(
    clientConfig: DarajaClientConfig,
    private readonly tokenProvider: () => Promise<string>,
  ) {
    this.client = new DarajaClient(clientConfig);
  }

  async initiateStkPush(input: {
    amount: number;
    phoneE164: string;
    planId: string;
    transactionDesc?: string;
  }): Promise<{ checkoutRequestId: string; merchantRequestId: string }> {
    const token = await this.tokenProvider();
    const accountReference = buildAccountReference(input.planId);
    const desc = (input.transactionDesc ?? "WiFi billing").slice(0, DARAJA_TRANSACTION_DESC_MAX);
    const response = await this.client.stkPush({
      amount: input.amount,
      phoneDigits: toDarajaPhoneDigits(input.phoneE164),
      accountReference,
      transactionDesc: desc,
      accessToken: token,
    });
    return {
      checkoutRequestId: response.CheckoutRequestID,
      merchantRequestId: response.MerchantRequestID,
    };
  }
}
