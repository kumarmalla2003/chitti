// frontend/src/features/ledger/hooks/useLedger.js

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPayments } from '../../../services/paymentsService';

/**
 * Combined hook for fetching both collections and payouts (payments) for the Ledger.
 * Uses the unified Payment API with payment_type filter.
 * 
 * @returns {Object} Combined ledger data and state
 */
export const useLedger = () => {
  // Fetch collection payments
  const collectionsQuery = useQuery({
    queryKey: ['payments', 'collection'],
    queryFn: () => getPayments({ payment_type: 'collection' }),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  // Fetch payout payments
  const payoutsQuery = useQuery({
    queryKey: ['payments', 'payout'],
    queryFn: () => getPayments({ payment_type: 'payout' }),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  const isLoading = collectionsQuery.isLoading || payoutsQuery.isLoading;
  const error = collectionsQuery.error || payoutsQuery.error;

  // Extract raw data - Payment API returns array directly or { payments: [] }
  const collections = useMemo(() => {
    const data = collectionsQuery.data;
    if (Array.isArray(data)) return data;
    return data?.payments || [];
  }, [collectionsQuery.data]);

  const payouts = useMemo(() => {
    const data = payoutsQuery.data;
    if (Array.isArray(data)) return data;
    return data?.payments || [];
  }, [payoutsQuery.data]);

  // Merge and sort for "All" tab - chronological view of all transactions
  const allTransactions = useMemo(() => {
    // Collection payments from Payment API
    const collectionItems = collections.map((c) => ({
      ...c,
      transactionType: 'collection',
      transactionDate: c.date,
      transactionAmount: c.amount,
      transactionMethod: c.method,
      displayName: c.member?.full_name || 'Unknown',
      chitName: c.chit?.name || 'Unknown',
    }));

    // Payout payments from Payment API
    const payoutItems = payouts.map((p) => ({
      ...p,
      transactionType: 'payout',
      transactionDate: p.date,
      transactionAmount: p.amount,
      transactionMethod: p.method,
      displayName: p.member?.full_name || 'Unknown',
      chitName: p.chit?.name || 'Unknown',
    }));

    return [...collectionItems, ...payoutItems].sort(
      (a, b) => new Date(b.transactionDate) - new Date(a.transactionDate)
    );
  }, [collections, payouts]);

  // Refetch both data sources
  const refetch = () => {
    collectionsQuery.refetch();
    payoutsQuery.refetch();
  };

  return {
    // Raw data
    collections,
    payouts,
    allTransactions,

    // Loading and error states
    isLoading,
    error,

    // Specific query states for granular control
    collectionsLoading: collectionsQuery.isLoading,
    payoutsLoading: payoutsQuery.isLoading,
    collectionsError: collectionsQuery.error,
    payoutsError: payoutsQuery.error,

    // Actions
    refetch,
  };
};

export default useLedger;
