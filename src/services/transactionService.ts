import { SpiderTransactionListSchema, type SpiderTransaction } from "@/domain/models";
import { storageGetRaw, storageSetRaw } from "@/infra/storage";

export function getTransactions(): SpiderTransaction[] {
  const raw = storageGetRaw("spider_transactions");
  if (!raw) return [];
  try {
    return SpiderTransactionListSchema.parse(JSON.parse(raw));
  } catch {
    storageSetRaw("spider_transactions", JSON.stringify([]));
    return [];
  }
}

export function prependTransaction(tx: SpiderTransaction): SpiderTransaction[] {
  const next = [tx, ...getTransactions()];
  storageSetRaw("spider_transactions", JSON.stringify(next));
  return next;
}

