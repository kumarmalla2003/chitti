// frontend/src/features/ledger/hooks/useLedger.js

import { useMemo } from 'react';
import { useCollections } from '../../collections/hooks/useCollections';
import { usePayouts } from '../../payouts/hooks/usePayouts';
import { useChits } from '../../chits/hooks/useChits';

/**
 * Combined hook for fetching both collections and payouts data.
 * Provides unified access to transaction data for the Ledger page.
 * 
 * @returns {Object} Combined ledger data and state
 */
export const useLedger = () => {
  const collectionsQuery = useCollections();
  const payoutsQuery = usePayouts();
  const chitsQuery = useChits();

  const isLoading = collectionsQuery.isLoading || payoutsQuery.isLoading || chitsQuery.isLoading;
  const error = collectionsQuery.error || payoutsQuery.error || chitsQuery.error;

  // Extract raw data
  const collections = useMemo(() => {
    return collectionsQuery.data?.collections || [];
  }, [collectionsQuery.data]);

  const payouts = useMemo(() => {
    const rawPayouts = payoutsQuery.data?.payouts ?? (Array.isArray(payoutsQuery.data) ? payoutsQuery.data : []);
    return rawPayouts;
  }, [payoutsQuery.data]);

  const chits = useMemo(() => {
    return chitsQuery.data?.chits || [];
  }, [chitsQuery.data]);

  // Merge and sort for "All" tab - chronological view of all transactions
  const allTransactions = useMemo(() => {
    const collectionItems = collections.map((c) => ({
      ...c,
      transactionType: 'collection',
      transactionDate: c.collection_date,
      transactionAmount: c.amount_paid,
      transactionMethod: c.collection_method,
      displayName: c.member?.full_name || 'Unknown',
      chitName: c.chit?.name || 'Unknown',
    }));

    const payoutItems = payouts
      .filter((p) => p.paid_date) // Only show completed payouts in "All" tab
      .map((p) => ({
        ...p,
        transactionType: 'payout',
        transactionDate: p.paid_date,
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
    chitsQuery.refetch();
  };

  return {
    // Raw data
    collections,
    payouts,
    chits,
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
