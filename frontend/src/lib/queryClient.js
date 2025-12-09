import { QueryClient } from '@tanstack/react-query';

/**
 * QueryClient instance with sensible defaults for the Chitti application.
 * 
 * @description
 * - staleTime: 5 minutes - Data considered fresh for 5 minutes
 * - gcTime: 30 minutes - Unused data garbage collected after 30 minutes
 * - retry: 1 - Single retry on failure
 * - refetchOnWindowFocus: false - Prevents aggressive refetching on window focus
 */
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
            retry: 1,
            refetchOnWindowFocus: false,
        },
        mutations: {
            retry: 0, // Don't retry mutations by default
        },
    },
});

export default queryClient;
