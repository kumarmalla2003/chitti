import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getAllCollections,
    getCollectionById,
    getCollectionsByChitId,
    getCollectionsByMemberId,
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
    details: () => [...collectionKeys.all, 'detail'],
    detail: (id) => [...collectionKeys.details(), id],
    byChit: (chitId) => [...collectionKeys.all, 'chit', chitId],
    byMember: (memberId) => [...collectionKeys.all, 'member', memberId],
};

/**
 * Hook to fetch all collections with optional filters.
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
    });
};

/**
 * Hook to fetch collections for a specific chit.
 * 
 * @param {string|number} chitId - The ID of the chit
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result with collections data
 * @example
 * const { data, isLoading } = useCollectionsByChit(chitId);
 * const collections = data?.collections ?? [];
 */
export const useCollectionsByChit = (chitId) => {
    return useQuery({
        queryKey: collectionKeys.byChit(chitId),
        queryFn: () => getCollectionsByChitId(chitId),
        enabled: Boolean(chitId),
    });
};

/**
 * Hook to fetch collections for a specific member.
 * 
 * @param {string|number} memberId - The ID of the member
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result with collections data
 * @example
 * const { data, isLoading } = useCollectionsByMember(memberId);
 * const collections = data?.collections ?? [];
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
 * Hook to create a new collection.
 * Automatically invalidates related caches on success.
 * 
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation result
 * @example
 * const createCollectionMutation = useCreateCollection();
 * createCollectionMutation.mutate(collectionData);
 */
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

/**
 * Hook to update an existing collection.
 * Automatically invalidates related caches on success.
 * 
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation result
 * @example
 * const updateCollectionMutation = useUpdateCollection();
 * updateCollectionMutation.mutate({ collectionId: 1, collectionData: { amount: 5000 } });
 */
export const useUpdateCollection = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ collectionId, collectionData }) => patchCollection(collectionId, collectionData),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: collectionKeys.detail(variables.collectionId) });
            queryClient.invalidateQueries({ queryKey: collectionKeys.lists() });
            // Invalidate chit and member specific queries
            queryClient.invalidateQueries({ queryKey: collectionKeys.all });
        },
    });
};

/**
 * Hook to delete a collection.
 * Automatically invalidates related caches on success.
 * 
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation result
 * @example
 * const deleteCollectionMutation = useDeleteCollection();
 * deleteCollectionMutation.mutate(collectionId);
 */
export const useDeleteCollection = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteCollection,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: collectionKeys.all });
        },
    });
};
