// frontend/src/features/members/hooks/useMember.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMemberById, updateMember, patchMember } from "../api/membersService";

export const useMember = (memberId) => {
  return useQuery({
    queryKey: ["member", memberId],
    queryFn: () => getMemberById(memberId),
    enabled: !!memberId,
  });
};

export const useUpdateMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateMember(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(["member", variables.id]);
      queryClient.invalidateQueries(["members"]);
    },
  });
};

export const usePatchMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => patchMember(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(["member", variables.id]);
      queryClient.invalidateQueries(["members"]);
    },
  });
};
