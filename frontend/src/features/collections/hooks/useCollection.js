// frontend/src/features/collections/hooks/useCollection.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCollectionById, createCollection, patchCollection } from "../api/collectionsService";

export const useCollection = (collectionId) => {
  return useQuery({
    queryKey: ["collection", collectionId],
    queryFn: () => getCollectionById(collectionId),
    enabled: !!collectionId,
  });
};

export const useCreateCollection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCollection,
    onSuccess: () => {
      queryClient.invalidateQueries(["collections"]);
    },
  });
};

export const useUpdateCollection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => patchCollection(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(["collection", variables.id]);
      queryClient.invalidateQueries(["collections"]);
    },
  });
};
