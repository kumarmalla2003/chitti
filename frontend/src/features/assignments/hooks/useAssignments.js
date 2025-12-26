import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    createAssignment,
    createBulkAssignments,
    getUnassignedMonths,
    getAssignmentsForMember,
    getAssignmentsForChit,
    deleteAssignment,
} from '../../../services/assignmentsService';
import { collectionKeys } from '../../collections/hooks/useCollections';

/**
 * Query key factory for assignments-related queries.
 * Provides consistent key generation for cache management.
 */
export const assignmentKeys = {
    all: ['assignments'],
    lists: () => [...assignmentKeys.all, 'list'],
    byChit: (chitId) => [...assignmentKeys.all, 'chit', chitId],
    byMember: (memberId) => [...assignmentKeys.all, 'member', memberId],
    unassignedMonths: (chitId) => [...assignmentKeys.all, 'unassigned', chitId],
};

/**
 * Hook to fetch assignments for a specific chit.
 * 
 * @param {string|number} chitId - The ID of the chit
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result with assignments data
 * @example
 * const { data, isLoading } = useAssignmentsByChit(chitId);
 * const assignments = data?.assignments ?? [];
 */
export const useAssignmentsByChit = (chitId) => {
    return useQuery({
        queryKey: assignmentKeys.byChit(chitId),
        queryFn: () => getAssignmentsForChit(chitId),
        enabled: Boolean(chitId),
    });
};

/**
 * Hook to fetch assignments for a specific member.
 * 
 * @param {string|number} memberId - The ID of the member
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result with assignments data
 * @example
 * const { data, isLoading } = useAssignmentsByMember(memberId);
 */
export const useAssignmentsByMember = (memberId) => {
    return useQuery({
        queryKey: assignmentKeys.byMember(memberId),
        queryFn: () => getAssignmentsForMember(memberId),
        enabled: Boolean(memberId),
    });
};

/**
 * Hook to fetch unassigned months for a specific chit.
 * 
 * @param {string|number} chitId - The ID of the chit
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result with unassigned months data
 * @example
 * const { data, isLoading } = useUnassignedMonths(chitId);
 */
export const useUnassignedMonths = (chitId) => {
    return useQuery({
        queryKey: assignmentKeys.unassignedMonths(chitId),
        queryFn: () => getUnassignedMonths(chitId),
        enabled: Boolean(chitId),
    });
};

/**
 * Hook to create a single assignment.
 * Automatically invalidates related caches on success.
 * 
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation result
 * @example
 * const createAssignmentMutation = useCreateAssignment();
 * createAssignmentMutation.mutate(assignmentData);
 */
export const useCreateAssignment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createAssignment,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: assignmentKeys.all });
            queryClient.invalidateQueries({ queryKey: collectionKeys.all });
        },
    });
};

/**
 * Hook to create multiple assignments at once.
 * Automatically invalidates related caches on success.
 * 
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation result
 * @example
 * const bulkAssignMutation = useCreateBulkAssignments();
 * bulkAssignMutation.mutate({ chitId, assignments: [...] });
 */
export const useCreateBulkAssignments = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ chitId, assignments }) => createBulkAssignments(chitId, assignments),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: assignmentKeys.byChit(variables.chitId) });
            queryClient.invalidateQueries({ queryKey: assignmentKeys.unassignedMonths(variables.chitId) });
            queryClient.invalidateQueries({ queryKey: collectionKeys.all });
        },
    });
};

/**
 * Hook to delete an assignment.
 * Automatically invalidates related caches on success.
 * 
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation result
 * @example
 * const deleteAssignmentMutation = useDeleteAssignment();
 * deleteAssignmentMutation.mutate(assignmentId);
 */
export const useDeleteAssignment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteAssignment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: assignmentKeys.all });
            queryClient.invalidateQueries({ queryKey: collectionKeys.all });
        },
    });
};

/**
 * Query key factory for month members queries.
 */
export const monthMembersKeys = {
    all: ['monthMembers'],
    byChitMonth: (chitId, month) => [...monthMembersKeys.all, chitId, month],
};

/**
 * Hook to fetch per-member breakdown for a specific month.
 * Only fetches when enabled is true (e.g., when a row is expanded).
 * 
 * @param {string|number} chitId - The ID of the chit
 * @param {number} month - The month number (1-based)
 * @param {boolean} enabled - Whether to enable the query
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result with month members data
 * @example
 * const { data, isLoading } = useMonthMembers(chitId, 3, isExpanded);
 */
import { getMonthMembers } from '../../../services/chitsService';

export const useMonthMembers = (chitId, month, enabled = false) => {
    return useQuery({
        queryKey: monthMembersKeys.byChitMonth(chitId, month),
        queryFn: () => getMonthMembers(chitId, month),
        enabled: enabled && Boolean(chitId) && Boolean(month),
        staleTime: 30 * 1000, // 30 seconds
    });
};
