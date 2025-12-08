// frontend/src/features/members/hooks/useMembers.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllMembers, createMember, updateMember, deleteMember } from "../api/membersService";

export const useMembers = () => {
  return useQuery({
    queryKey: ["members"],
    queryFn: getAllMembers,
  });
};

export const useCreateMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMember,
    onSuccess: () => {
      queryClient.invalidateQueries(["members"]);
    },
  });
};

export const useDeleteMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMember,
    onSuccess: () => {
      queryClient.invalidateQueries(["members"]);
    },
  });
};
