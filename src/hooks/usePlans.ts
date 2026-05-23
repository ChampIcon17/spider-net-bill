import { useQuery } from "@tanstack/react-query";
import { listPlansApi, type PlanDto } from "@/services/backendApi";

export function usePlans() {
  return useQuery<PlanDto[]>({
    queryKey: ["plans"],
    queryFn: listPlansApi,
    staleTime: 300_000,
  });
}
