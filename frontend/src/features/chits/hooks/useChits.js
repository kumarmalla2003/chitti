// frontend/src/features/chits/hooks/useChits.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllChits, deleteChit } from "../api/chitsService";

export const useChits = () => {
  return useQuery({
    queryKey: ["chits"],
    queryFn: getAllChits,
  });
};

export const useDeleteChit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteChit,
    onSuccess: () => {
      queryClient.invalidateQueries(["chits"]);
    },
  });
};
