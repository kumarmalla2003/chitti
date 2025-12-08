// frontend/src/features/payouts/hooks/usePayouts.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllPayouts, deletePayout } from "../api/payoutsService";

export const usePayouts = (filters) => {
  return useQuery({
    queryKey: ["payouts", filters],
    queryFn: () => getAllPayouts(filters),
  });
};

export const useDeletePayout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePayout,
    onSuccess: () => {
      queryClient.invalidateQueries(["payouts"]);
    },
  });
};
