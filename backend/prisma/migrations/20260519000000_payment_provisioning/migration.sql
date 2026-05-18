-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "macAddress" TEXT;
ALTER TABLE "Payment" ADD COLUMN "idempotencyKey" TEXT;
ALTER TABLE "Payment" ADD COLUMN "provisionedAt" TIMESTAMP(3);

-- Backfill macAddress for any existing rows (placeholder; no sessions recoverable)
UPDATE "Payment" SET "macAddress" = '00:00:00:00:00:00' WHERE "macAddress" IS NULL;

ALTER TABLE "Payment" ALTER COLUMN "macAddress" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_idempotencyKey_key" ON "Payment"("idempotencyKey");
CREATE INDEX "Payment_idempotencyKey_idx" ON "Payment"("idempotencyKey");
