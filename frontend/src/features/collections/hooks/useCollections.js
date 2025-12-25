import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getAllCollections,
    getCollectionById,
    getCollectionsByChitId,
    getCollectionsByMemberId,
    updateCollection,
    resetCollection,
    // Backward compatibility
    createCollection,
    patchCollection,
    deleteCollection,
} from '../../../services/collectionsService';
import { chitKeys } from '../../chits/hooks/useChits';
import { memberKeys } from '../../members/hooks/useMembers';

/**
 * Query key factory for collections-related queries.
 * Provides consistent key generation for cache management.
 */
export const collectionKeys = {
    all: ['collections'],
    lists: () => [...collectionKeys.all, 'list'],
    list: (filters) => [...collectionKeys.lists(), filters],
    collected: () => [...collectionKeys.all, 'collected'],
    details: () => [...collectionKeys.all, 'detail'],
    detail: (id) => [...collectionKeys.details(), id],
    byChit: (chitId) => [...collectionKeys.all, 'chit', chitId],
    byMember: (memberId) => [...collectionKeys.all, 'member', memberId],
};

/**
 * Hook to fetch all collections (both scheduled and collected).
 * 
 * @param {Object} filters - Optional filter parameters
 * @param {string} [filters.chitId] - Filter by chit ID
 * @param {string} [filters.memberId] - Filter by member ID
 * @param {string} [filters.startDate] - Filter by start date
 * @param {string} [filters.endDate] - Filter by end date
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result with collections data
 */
export const useCollections = (filters = {}) => {
    return useQuery({
        queryKey: collectionKeys.list(filters),
        queryFn: () => getAllCollections(filters),
        staleTime: 1000 * 60 * 5,  // 5 minutes
        gcTime: 1000 * 60 * 30,    // 30 minutes
    });
};

/**
 * Hook to fetch collections with 'collected' status.
 * Uses getAllCollections with status=collected filter.
 * 
 * @param {Object} filters - Optional filter parameters
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result with collected payments
 */
export const useCollectedPayments = (filters = {}) => {
    return useQuery({
        queryKey: collectionKeys.collected(),
        queryFn: () => getAllCollections({ ...filters, status: 'collected' }),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 30,
    });
};

/**
 * Hook to fetch collections for a specific chit.
 * 
 * @param {string|number} chitId - The ID of the chit
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result with collections data
 */
export const useCollectionsByChit = (chitId) => {
    return useQuery({
        queryKey: collectionKeys.byChit(chitId),
        queryFn: () => getCollectionsByChitId(chitId),
        enabled: Boolean(chitId),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 30,
    });
};

/**
 * Hook to fetch collections for a specific member.
 * 
 * @param {string|number} memberId - The ID of the member
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result with collections data
 */
export const useCollectionsByMember = (memberId) => {
    return useQuery({
        queryKey: collectionKeys.byMember(memberId),
        queryFn: () => getCollectionsByMemberId(memberId),
        enabled: Boolean(memberId),
    });
};

/**
 * Hook to fetch a single collection by ID.
 * 
 * @param {string|number} collectionId - The ID of the collection
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result with collection data
 */
export const useCollectionDetails = (collectionId) => {
    return useQuery({
        queryKey: collectionKeys.detail(collectionId),
        queryFn: () => getCollectionById(collectionId),
        enabled: Boolean(collectionId),
    });
};

/**
 * Hook to update a collection (record payment or update expected amount).
 * Automatically invalidates related caches on success.
 * 
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation result
 */
export const useUpdateCollection = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ collectionId, collectionData }) => updateCollection(collectionId, collectionData),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: collectionKeys.detail(variables.collectionId) });
            queryClient.invalidateQueries({ queryKey: collectionKeys.lists() });
            queryClient.invalidateQueries({ queryKey: collectionKeys.collected() });
            queryClient.invalidateQueries({ queryKey: collectionKeys.all });
        },
    });
};

/**
 * Hook to reset a collection to scheduled state.
 * Clears actual payment data but keeps the schedule.
 * 
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation result
 */
export const useResetCollection = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: resetCollection,
        onSuccess: (data, collectionId) => {
            queryClient.invalidateQueries({ queryKey: collectionKeys.detail(collectionId) });
            queryClient.invalidateQueries({ queryKey: collectionKeys.all });
        },
    });
};

// Backward compatibility aliases
export const useCreateCollection = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createCollection,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: collectionKeys.lists() });
            if (data?.chit_id) {
                queryClient.invalidateQueries({ queryKey: collectionKeys.byChit(data.chit_id) });
            }
            if (data?.member_id) {
                queryClient.invalidateQueries({ queryKey: collectionKeys.byMember(data.member_id) });
            }
        },
    });
};

export const useDeleteCollection = useResetCollection;
