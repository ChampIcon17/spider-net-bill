import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { LoginDto } from "../../auth/dto/login.dto";
import { InitiatePaymentDto } from "../../payments/dto/initiate-payment.dto";
import { isValidKenyanPhoneInput, toKenyanE164 } from "./phone.util";

const SAMPLE_MAC = "02:11:22:33:44:55";
const SAMPLE_PLAN_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

describe("toKenyanE164", () => {
  it.each([
    ["0712345678", "+254712345678"],
    ["+254712345678", "+254712345678"],
    ["254712345678", "+254712345678"],
    ["07 123 456 78", "+254712345678"],
  ])("normalizes %s to %s", (input, expected) => {
    expect(toKenyanE164(input)).toBe(expected);
  });

  it("leaves non-string values unchanged", () => {
    expect(toKenyanE164(undefined)).toBeUndefined();
  });
});

describe("isValidKenyanPhoneInput", () => {
  it.each(["0712345678", "+254712345678", "254712345678"])("accepts %s", (input) => {
    expect(isValidKenyanPhoneInput(input)).toBe(true);
  });

  it.each(["712345678", "071234567", "+25471234567", "0812345678"])("rejects %s", (input) => {
    expect(isValidKenyanPhoneInput(input)).toBe(false);
  });
});

describe("LoginDto", () => {
  it("accepts 07 local format and normalizes to E.164", async () => {
    const dto = plainToInstance(LoginDto, {
      phone: "0712345678",
      password: "Test1234",
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.phone).toBe("+254712345678");
  });

  it("accepts +254 format unchanged", async () => {
    const dto = plainToInstance(LoginDto, {
      phone: "+254712345678",
      password: "Test1234",
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.phone).toBe("+254712345678");
  });

  it("rejects invalid local numbers", async () => {
    const dto = plainToInstance(LoginDto, {
      phone: "0812345678",
      password: "Test1234",
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === "phone")).toBe(true);
  });
});

describe("InitiatePaymentDto", () => {
  const base = {
    planId: SAMPLE_PLAN_ID,
    macAddress: SAMPLE_MAC,
  };

  it("accepts optional phone in 07 format", async () => {
    const dto = plainToInstance(InitiatePaymentDto, {
      ...base,
      phone: "0712345678",
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.phone).toBe("+254712345678");
  });

  it("allows omitted phone", async () => {
    const dto = plainToInstance(InitiatePaymentDto, base);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.phone).toBeUndefined();
  });
});
