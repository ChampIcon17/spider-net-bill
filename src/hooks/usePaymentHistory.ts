import { useQuery } from "@tanstack/react-query";
import { getPaymentHistoryApi, type PaymentHistoryItem } from "@/services/backendApi";

export type PaymentRecord = {
  id: string;
  createdAt: string;
  amount: number;
  status: string;
  plan: { name: string };
};

function mapPayment(row: PaymentHistoryItem): PaymentRecord {
  return {
    id: row.id,
    createdAt: row.createdAt,
    amount: Number(row.amount),
    status: row.status,
    plan: { name: row.plan.name },
  };
}

export function usePaymentHistory() {
  return useQuery({
    queryKey: ["payments"],
    queryFn: async () => (await getPaymentHistoryApi()).map(mapPayment),
  });
}
