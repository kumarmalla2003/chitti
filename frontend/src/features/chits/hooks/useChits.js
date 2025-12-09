import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getAllChits,
    getChitById,
    createChit,
    patchChit,
    deleteChit,
} from '../../../services/chitsService';

/**
 * Query key factory for chits-related queries.
 * Provides consistent key generation for cache management.
 */
export const chitKeys = {
    all: ['chits'],
    lists: () => [...chitKeys.all, 'list'],
    list: (filters) => [...chitKeys.lists(), filters],
    details: () => [...chitKeys.all, 'detail'],
    detail: (id) => [...chitKeys.details(), id],
};

/**
 * Hook to fetch all chits.
 * 
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result with chits data
 * @example
 * const { data, isLoading, error } = useChits();
 * const chits = data?.chits ?? [];
 */
export const useChits = () => {
    return useQuery({
        queryKey: chitKeys.lists(),
        queryFn: getAllChits,
    });
};

/**
 * Hook to fetch a single chit by ID.
 * 
 * @param {string|number} chitId - The ID of the chit to fetch
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result with chit data
 * @example
 * const { data: chit, isLoading, error } = useChitDetails(chitId);
 */
export const useChitDetails = (chitId) => {
    return useQuery({
        queryKey: chitKeys.detail(chitId),
        queryFn: () => getChitById(chitId),
        enabled: Boolean(chitId),
    });
};

/**
 * Hook to create a new chit.
 * Automatically invalidates the chits list cache on success.
 * 
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation result
 * @example
 * const createChitMutation = useCreateChit();
 * createChitMutation.mutate(chitData, {
 *   onSuccess: (newChit) => console.log('Created:', newChit),
 *   onError: (error) => console.error(error.message),
 * });
 */
export const useCreateChit = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createChit,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: chitKeys.lists() });
        },
    });
};

/**
 * Hook to update an existing chit.
 * Automatically invalidates the chit detail and list caches on success.
 * 
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation result
 * @example
 * const updateChitMutation = useUpdateChit();
 * updateChitMutation.mutate({ chitId: 1, chitData: { name: 'Updated' } });
 */
export const useUpdateChit = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ chitId, chitData }) => patchChit(chitId, chitData),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: chitKeys.detail(variables.chitId) });
            queryClient.invalidateQueries({ queryKey: chitKeys.lists() });
        },
    });
};

/**
 * Hook to delete a chit.
 * Automatically invalidates the chits list cache on success.
 * 
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation result
 * @example
 * const deleteChitMutation = useDeleteChit();
 * deleteChitMutation.mutate(chitId, {
 *   onSuccess: () => console.log('Deleted successfully'),
 * });
 */
export const useDeleteChit = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteChit,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: chitKeys.lists() });
        },
    });
};
