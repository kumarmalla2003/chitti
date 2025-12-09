import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getAllPayouts,
    getPayoutsByChitId,
    getPayoutsByMemberId,
    getPayoutById,
    updatePayout,
    deletePayout,
} from '../../../services/payoutsService';

/**
 * Query key factory for payouts-related queries.
 * Provides consistent key generation for cache management.
 */
export const payoutKeys = {
    all: ['payouts'],
    lists: () => [...payoutKeys.all, 'list'],
    list: (filters) => [...payoutKeys.lists(), filters],
    details: () => [...payoutKeys.all, 'detail'],
    detail: (id) => [...payoutKeys.details(), id],
    byChit: (chitId) => [...payoutKeys.all, 'chit', chitId],
    byMember: (memberId) => [...payoutKeys.all, 'member', memberId],
};

/**
 * Hook to fetch all payouts with optional filters.
 * 
 * @param {Object} filters - Optional filter parameters
 * @param {string} [filters.chitId] - Filter by chit ID
 * @param {string} [filters.memberId] - Filter by member ID
 * @param {string} [filters.startDate] - Filter by start date
 * @param {string} [filters.endDate] - Filter by end date
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result with payouts data
 */
export const usePayouts = (filters = {}) => {
    return useQuery({
        queryKey: payoutKeys.list(filters),
        queryFn: () => getAllPayouts(filters),
        staleTime: 1000 * 60 * 5,  // 5 minutes
        gcTime: 1000 * 60 * 30,    // 30 minutes
    });
};

/**
 * Hook to fetch payouts for a specific chit.
 * 
 * @param {string|number} chitId - The ID of the chit
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result with payouts data
 * @example
 * const { data, isLoading } = usePayoutsByChit(chitId);
 * const payouts = data?.payouts ?? [];
 */
export const usePayoutsByChit = (chitId) => {
    return useQuery({
        queryKey: payoutKeys.byChit(chitId),
        queryFn: () => getPayoutsByChitId(chitId),
        enabled: Boolean(chitId),
        staleTime: 1000 * 60 * 5,  // 5 minutes
        gcTime: 1000 * 60 * 30,    // 30 minutes
    });
};

/**
 * Hook to fetch payouts for a specific member.
 * 
 * @param {string|number} memberId - The ID of the member
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result with payouts data
 * @example
 * const { data, isLoading } = usePayoutsByMember(memberId);
 * const payouts = data?.payouts ?? [];
 */
export const usePayoutsByMember = (memberId) => {
    return useQuery({
        queryKey: payoutKeys.byMember(memberId),
        queryFn: () => getPayoutsByMemberId(memberId),
        enabled: Boolean(memberId),
    });
};

/**
 * Hook to fetch a single payout by ID.
 * 
 * @param {string|number} payoutId - The ID of the payout
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result with payout data
 */
export const usePayoutDetails = (payoutId) => {
    return useQuery({
        queryKey: payoutKeys.detail(payoutId),
        queryFn: () => getPayoutById(payoutId),
        enabled: Boolean(payoutId),
    });
};

/**
 * Hook to update a payout.
 * Automatically invalidates related caches on success.
 * 
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation result
 * @example
 * const updatePayoutMutation = useUpdatePayout();
 * updatePayoutMutation.mutate({ payoutId: 1, payoutData: { status: 'completed' } });
 */
export const useUpdatePayout = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ payoutId, payoutData }) => updatePayout(payoutId, payoutData),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: payoutKeys.detail(variables.payoutId) });
            queryClient.invalidateQueries({ queryKey: payoutKeys.all });
        },
    });
};

/**
 * Hook to delete a payout.
 * Automatically invalidates related caches on success.
 * 
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation result
 * @example
 * const deletePayoutMutation = useDeletePayout();
 * deletePayoutMutation.mutate(payoutId);
 */
export const useDeletePayout = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deletePayout,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: payoutKeys.all });
        },
    });
};
