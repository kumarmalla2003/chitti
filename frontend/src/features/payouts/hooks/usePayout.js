// frontend/src/features/payouts/hooks/usePayout.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPayoutById, updatePayout } from "../api/payoutsService";

export const usePayout = (payoutId) => {
  return useQuery({
    queryKey: ["payout", payoutId],
    queryFn: () => getPayoutById(payoutId),
    enabled: !!payoutId,
  });
};

export const useUpdatePayout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updatePayout(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(["payout", variables.id]);
      queryClient.invalidateQueries(["payouts"]);
    },
  });
};
