import { z } from "zod";

export const SpiderUserSchema = z.object({
  id: z.string().trim().min(1).optional(),
  phone: z.string().trim().min(1).optional(),
  email: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1).optional(),
  role: z.string().trim().min(1).optional(),
});
export type SpiderUser = z.infer<typeof SpiderUserSchema>;

export const SpiderBundleSchema = z.object({
  plan: z.string().trim().min(1),
  expiryTime: z.number().int().positive(),
  purchaseTime: z.number().int().positive(),
});
export type SpiderBundle = z.infer<typeof SpiderBundleSchema>;

export const SpiderTransactionSchema = z.object({
  id: z.string().trim().min(1),
  plan: z.string().trim().min(1),
  duration: z.string().trim().min(1),
  amount: z.number().finite(),
  date: z.string().trim().min(1), // ISO string
  status: z.string().trim().min(1),
});
export type SpiderTransaction = z.infer<typeof SpiderTransactionSchema>;

export const SpiderDeviceSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  status: z.union([z.literal("Active"), z.literal("Inactive")]),
  addedDate: z.string().trim().min(1),
});
export type SpiderDevice = z.infer<typeof SpiderDeviceSchema>;

export const SpiderDeviceListSchema = z.array(SpiderDeviceSchema);
export const SpiderTransactionListSchema = z.array(SpiderTransactionSchema);

