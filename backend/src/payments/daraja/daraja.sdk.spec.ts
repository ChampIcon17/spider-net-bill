import { createHmac } from "crypto";
import {
  amountsMatch,
  buildAccountReference,
  isStkCallbackSuccess,
  parseStkCallbackBody,
  parseStkCallbackMetadata,
  toDarajaPhoneDigits,
  verifyWebhookSignature,
} from "./daraja.sdk";

describe("DarajaSdk helpers", () => {
  describe("buildAccountReference", () => {
    it("is at most 12 characters", () => {
      const ref = buildAccountReference("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");
      expect(ref.length).toBeLessThanOrEqual(12);
      expect(ref).toBe("A0EEBC999C0B");
    });
  });

  describe("toDarajaPhoneDigits", () => {
    it("strips leading plus", () => {
      expect(toDarajaPhoneDigits("+254712345678")).toBe("254712345678");
    });
  });

  describe("isStkCallbackSuccess", () => {
    it.each([0, "0"])("accepts %s", (code) => {
      expect(isStkCallbackSuccess(code)).toBe(true);
    });
    it.each([1, "1032"])("rejects %s", (code) => {
      expect(isStkCallbackSuccess(code)).toBe(false);
    });
  });

  describe("amountsMatch", () => {
    it("compares amounts in cents", () => {
      expect(amountsMatch(50, 50)).toBe(true);
      expect(amountsMatch(50, 49.99)).toBe(false);
    });
  });

  describe("parseStkCallbackMetadata", () => {
    it("extracts amount and receipt", () => {
      const meta = parseStkCallbackMetadata([
        { Name: "Amount", Value: 50 },
        { Name: "MpesaReceiptNumber", Value: "QAB123" },
      ]);
      expect(meta.amount).toBe(50);
      expect(meta.mpesaReceiptNumber).toBe("QAB123");
    });
  });

  describe("parseStkCallbackBody", () => {
    it("parses a valid callback", () => {
      const parsed = parseStkCallbackBody({
        Body: {
          stkCallback: {
            MerchantRequestID: "m1",
            CheckoutRequestID: "ws_CO_123",
            ResultCode: 0,
            ResultDesc: "OK",
            CallbackMetadata: {
              Item: [{ Name: "Amount", Value: 100 }],
            },
          },
        },
      });
      expect(parsed?.checkoutRequestId).toBe("ws_CO_123");
      expect(parsed?.metadata.amount).toBe(100);
    });
  });

  describe("verifyWebhookSignature", () => {
    it("validates HMAC hex signature", () => {
      const secret = "test-secret";
      const rawBody = '{"Body":{"stkCallback":{"ResultCode":0}}}';
      const sig = createHmac("sha256", secret).update(rawBody).digest("hex");
      expect(verifyWebhookSignature(secret, sig, rawBody)).toBe(true);
      expect(verifyWebhookSignature(secret, sig, '{"tampered":true}')).toBe(false);
    });
  });
});
