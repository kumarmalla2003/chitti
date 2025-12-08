// frontend/src/features/chits/hooks/useChit.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getChitById, createChit, patchChit } from "../api/chitsService";

export const useChit = (chitId) => {
  return useQuery({
    queryKey: ["chit", chitId],
    queryFn: () => getChitById(chitId),
    enabled: !!chitId,
  });
};

export const useCreateChit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chitData) => createChit(chitData),
    onSuccess: () => {
      queryClient.invalidateQueries(["chits"]);
    },
  });
};

export const useUpdateChit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => patchChit(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(["chit", variables.id]);
      queryClient.invalidateQueries(["chits"]);
    },
  });
};
