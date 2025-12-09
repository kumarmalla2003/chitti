import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getAllMembers,
    getMemberById,
    createMember,
    updateMember,
    patchMember,
    deleteMember,
    searchMembers,
} from '../../../services/membersService';

/**
 * Query key factory for members-related queries.
 * Provides consistent key generation for cache management.
 */
export const memberKeys = {
    all: ['members'],
    lists: () => [...memberKeys.all, 'list'],
    list: (filters) => [...memberKeys.lists(), filters],
    details: () => [...memberKeys.all, 'detail'],
    detail: (id) => [...memberKeys.details(), id],
    search: (query) => [...memberKeys.all, 'search', query],
};

/**
 * Hook to fetch all members.
 * 
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result with members data
 * @example
 * const { data, isLoading, error } = useMembers();
 * const members = data?.members ?? [];
 */
export const useMembers = () => {
    return useQuery({
        queryKey: memberKeys.lists(),
        queryFn: getAllMembers,
        staleTime: 1000 * 60 * 5,  // 5 minutes
        gcTime: 1000 * 60 * 30,    // 30 minutes
    });
};

/**
 * Hook to fetch a single member by ID.
 * 
 * @param {string|number} memberId - The ID of the member to fetch
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result with member data
 * @example
 * const { data: member, isLoading, error } = useMemberDetails(memberId);
 */
export const useMemberDetails = (memberId) => {
    return useQuery({
        queryKey: memberKeys.detail(memberId),
        queryFn: () => getMemberById(memberId),
        enabled: Boolean(memberId),
        staleTime: 1000 * 60 * 5,  // 5 minutes
        gcTime: 1000 * 60 * 30,    // 30 minutes
    });
};

/**
 * Hook to search members by query string.
 * 
 * @param {string} query - The search query
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result with search results
 * @example
 * const { data: members, isLoading } = useSearchMembers(searchQuery);
 */
export const useSearchMembers = (query) => {
    return useQuery({
        queryKey: memberKeys.search(query),
        queryFn: () => searchMembers(query),
        enabled: Boolean(query && query.trim().length > 0),
        staleTime: 1000 * 60, // 1 minute for search results
    });
};

/**
 * Hook to create a new member.
 * Automatically invalidates the members list cache on success.
 * 
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation result
 * @example
 * const createMemberMutation = useCreateMember();
 * createMemberMutation.mutate(memberData, {
 *   onSuccess: (newMember) => console.log('Created:', newMember),
 *   onError: (error) => console.error(error.message),
 * });
 */
export const useCreateMember = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createMember,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
        },
    });
};

/**
 * Hook to update an existing member (full update).
 * Automatically invalidates the member detail and list caches on success.
 * 
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation result
 * @example
 * const updateMemberMutation = useUpdateMember();
 * updateMemberMutation.mutate({ memberId: 1, memberData: { full_name: 'John Doe' } });
 */
export const useUpdateMember = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ memberId, memberData }) => updateMember(memberId, memberData),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: memberKeys.detail(variables.memberId) });
            queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
        },
    });
};

/**
 * Hook to partially update an existing member.
 * Automatically invalidates the member detail and list caches on success.
 * 
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation result
 * @example
 * const patchMemberMutation = usePatchMember();
 * patchMemberMutation.mutate({ memberId: 1, memberData: { phone_number: '1234567890' } });
 */
export const usePatchMember = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ memberId, memberData }) => patchMember(memberId, memberData),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: memberKeys.detail(variables.memberId) });
            queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
        },
    });
};

/**
 * Hook to delete a member.
 * Automatically invalidates the members list cache on success.
 * 
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation result
 * @example
 * const deleteMemberMutation = useDeleteMember();
 * deleteMemberMutation.mutate(memberId, {
 *   onSuccess: () => console.log('Deleted successfully'),
 * });
 */
export const useDeleteMember = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteMember,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
        },
    });
};
