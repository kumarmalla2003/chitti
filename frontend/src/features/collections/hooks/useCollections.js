import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getPayments,
    getPaymentById,
    createPayment,
    updatePayment,
    deletePayment,
} from '../../../services/paymentsService';
import {
    getCollectionById, // Still needed if getPaymentById doesn't fully replace it or for specific logic
    // We might need to replace this with getPaymentById if the ID format changes or if we want full migration
} from '../../../services/collectionsService';
// Note: We are migrating to paymentsService, so we should favor it.
// However, getCollectionById in collectionsService throws error now? 
// Yes, line 23 of collectionsService throws Error(DEPRECATION_MESSAGE).
// So we MUST replace imports.

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
 * Uses paymentsService with payment_type='collection'
 */
export const useCollections = (filters = {}) => {
    return useQuery({
        queryKey: collectionKeys.list(filters),
        queryFn: () => getPayments({ ...filters, payment_type: 'collection' }),
        staleTime: 1000 * 60 * 5,  // 5 minutes
        gcTime: 1000 * 60 * 30,    // 30 minutes
        select: (data) => {
            // Adapt Payment API response to match expected 'collections' format if needed
            // Assuming API returns { payments: [...] } or just [...]
            // If it returns { payments: [] }, we might need to map it to { collections: [] } for compatibility
            if (data?.payments) {
                return { collections: data.payments };
            }
            return { collections: Array.isArray(data) ? data : [] };
        }
    });
};

/**
 * Hook to fetch collections with 'collected' status.
 */
export const useCollectedPayments = (filters = {}) => {
    return useQuery({
        queryKey: collectionKeys.collected(),
        queryFn: () => getPayments({ ...filters, payment_type: 'collection', status: 'collected' }), // status might differ in new API?
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 30,
        select: (data) => {
            if (data?.payments) return { collections: data.payments };
            return { collections: Array.isArray(data) ? data : [] };
        }
    });
};

/**
 * Hook to fetch collections for a specific chit.
 */
export const useCollectionsByChit = (chitId) => {
    return useQuery({
        queryKey: collectionKeys.byChit(chitId),
        queryFn: () => getPayments({ chit_id: chitId, payment_type: 'collection' }),
        enabled: Boolean(chitId),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 30,
        select: (data) => {
            if (data?.payments) return { collections: data.payments };
            return { collections: Array.isArray(data) ? data : [] };
        }
    });
};

/**
 * Hook to fetch collections for a specific member.
 */
export const useCollectionsByMember = (memberId) => {
    return useQuery({
        queryKey: collectionKeys.byMember(memberId),
        queryFn: () => getPayments({ member_id: memberId, payment_type: 'collection' }),
        enabled: Boolean(memberId),
        select: (data) => {
            if (data?.payments) return { collections: data.payments };
            return { collections: Array.isArray(data) ? data : [] };
        }
    });
};

/**
 * Hook to fetch a single collection by ID.
 * Replaced getCollectionById with appropriate call if needed, 
 * or assuming getPayments works with ID? 
 * Usually getPaymentById(id)
 */
export const useCollectionDetails = (collectionId) => {
    // We need getPaymentById from paymentsService
    // We need getPaymentById from paymentsService
    // It is imported at the top level now


    return useQuery({
        queryKey: collectionKeys.detail(collectionId),
        queryFn: () => getPaymentById(collectionId),
        enabled: Boolean(collectionId),
    });
};

/**
 * Hook to update a collection (record payment).
 * Uses updatePayment
 */
export const useUpdateCollection = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ collectionId, collectionData }) => updatePayment(collectionId, collectionData),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: collectionKeys.detail(variables.collectionId) });
            queryClient.invalidateQueries({ queryKey: collectionKeys.lists() });
            queryClient.invalidateQueries({ queryKey: collectionKeys.collected() });
            queryClient.invalidateQueries({ queryKey: collectionKeys.all });
            // Invalidate chit/member specific lists if possible
        },
    });
};

/**
 * Hook to reset/delete a collection.
 * Uses deletePayment
 */
export const useDeleteCollection = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deletePayment,
        onSuccess: (data, collectionId) => {
            queryClient.invalidateQueries({ queryKey: collectionKeys.detail(collectionId) });
            queryClient.invalidateQueries({ queryKey: collectionKeys.all });
            queryClient.invalidateQueries({ queryKey: collectionKeys.lists() });
        },
    });
};

// Backward compatibility aliases for creating
export const useCreateCollection = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => createPayment({ ...data, payment_type: 'collection' }),
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

export const useResetCollection = useDeleteCollection;
