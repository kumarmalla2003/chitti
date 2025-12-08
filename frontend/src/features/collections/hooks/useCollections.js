// frontend/src/features/collections/hooks/useCollections.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllCollections, deleteCollection } from "../api/collectionsService";

export const useCollections = (filters) => {
  return useQuery({
    queryKey: ["collections", filters],
    queryFn: () => getAllCollections(filters),
  });
};

export const useDeleteCollection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCollection,
    onSuccess: () => {
      queryClient.invalidateQueries(["collections"]);
    },
  });
};
