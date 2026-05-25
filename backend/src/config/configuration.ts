import * as Joi from "joi";

/** Safaricom Daraja sandbox Lipa Na M-Pesa Online test credentials. */
export const MPESA_SANDBOX_SHORTCODE = "174379";
export const MPESA_SANDBOX_PASSKEY =
  "bfb279f9aa9bdbcf158e97dd1a267de58e53ed1aa32540bccb6ef878f04be06f";

function isBlank(value: unknown): boolean {
  return value == null || (typeof value === "string" && value.trim() === "");
}

/** Fill standard sandbox values when MPESA_* are empty (override in .env.mpesa if STK fails). */
export function applyMpesaSandboxDefaults(config: Record<string, unknown>): Record<string, unknown> {
  if (config.MPESA_ENV !== "sandbox") {
    return config;
  }

  const next = { ...config };
  if (isBlank(next.MPESA_SHORTCODE)) {
    next.MPESA_SHORTCODE = MPESA_SANDBOX_SHORTCODE;
  }
  if (isBlank(next.MPESA_PASSKEY)) {
    next.MPESA_PASSKEY = MPESA_SANDBOX_PASSKEY;
  }
  if (isBlank(next.MPESA_CALLBACK_URL)) {
    const port = next.PORT ?? 3000;
    next.MPESA_CALLBACK_URL = `http://localhost:${port}/api/v1/payments/webhook`;
  }
  return next;
}

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid("development", "production", "test").default("development"),
  PORT: Joi.number().default(3000),
  FRONTEND_URL: Joi.string().uri().required(),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default("7d"),
  REDIS_URL: Joi.string().required(),
  MPESA_ENV: Joi.string().valid("sandbox", "production").default("sandbox"),
  MPESA_CONSUMER_KEY: Joi.string().required(),
  MPESA_CONSUMER_SECRET: Joi.string().required(),
  MPESA_SHORTCODE: Joi.string().required(),
  MPESA_PASSKEY: Joi.string().required(),
  MPESA_CALLBACK_URL: Joi.string().uri().required(),
  MPESA_PHONE_PREFIX: Joi.string().default("254"),
  DARAJA_ALLOWED_CIDRS: Joi.string().default(""),
  DARAJA_WEBHOOK_SECRET: Joi.string().allow("").optional(),
  MIKROTIK_HOST: Joi.string().required(),
  MIKROTIK_USER: Joi.string().required(),
  MIKROTIK_PASS: Joi.string().required(),
  MIKROTIK_PORT: Joi.number().default(8728),
  MIKROTIK_ENABLED: Joi.string().valid("true", "false").default("false"),
  DARAJA_WEBHOOK_BYPASS: Joi.string().valid("true", "false").optional(),
});

/** Used by ConfigModule `validate` — fail-fast on boot with a readable error. */
export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const withMpesaDefaults = applyMpesaSandboxDefaults(config);
  const v = validationSchema.validate(withMpesaDefaults, {
    allowUnknown: true,
    stripUnknown: true,
  });
  if (v.error) {
    const msg = v.error.details.map((d) => d.message).join("; ");
    throw new Error(`Environment validation failed: ${msg}`);
  }
  return v.value as Record<string, unknown>;
}
