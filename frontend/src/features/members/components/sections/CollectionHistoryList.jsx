// frontend/src/features/members/components/sections/CollectionHistoryList.jsx

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Table from "../../../../components/ui/Table";
import Pagination from "../../../../components/ui/Pagination";
import Message from "../../../../components/ui/Message";
import Skeleton from "../../../../components/ui/Skeleton";
import {
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Receipt,
  WalletMinimal,
} from "lucide-react";
import {
  useCollectionsByChit,
  useCollectionsByMember,
} from "../../../collections/hooks/useCollections";
import {
  usePayoutsByChit,
  usePayoutsByMember,
} from "../../../payouts/hooks/usePayouts";

const ITEMS_PER_PAGE = 10;

/**
 * CollectionHistoryList component - displays transaction history.
 * Simplified to show only list, search, and log payment button.
 */
const CollectionHistoryList = ({
  chitId,
  memberId,
  mode,
  onManage,
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // React Query hooks for collections
  const {
    data: collectionsDataByChit,
    isLoading: collectionsChitLoading,
    error: collectionsChitError,
  } = useCollectionsByChit(chitId);

  const {
    data: collectionsDataByMember,
    isLoading: collectionsMemberLoading,
    error: collectionsMemberError,
  } = useCollectionsByMember(memberId);

  // React Query hooks for payouts
  const {
    data: payoutsDataByChit,
    isLoading: payoutsChitLoading,
    error: payoutsChitError,
  } = usePayoutsByChit(chitId);

  const {
    data: payoutsDataByMember,
    isLoading: payoutsMemberLoading,
    error: payoutsMemberError,
  } = usePayoutsByMember(memberId);

  // Determine which data to use based on chitId or memberId
  const collectionsData = chitId ? collectionsDataByChit : collectionsDataByMember;
  const payoutsData = chitId ? payoutsDataByChit : payoutsDataByMember;
  const collectionsLoading = chitId ? collectionsChitLoading : collectionsMemberLoading;
  const payoutsLoading = chitId ? payoutsChitLoading : payoutsMemberLoading;
  const collectionsError = chitId ? collectionsChitError : collectionsMemberError;
  const payoutsError = chitId ? payoutsChitError : payoutsMemberError;

  const loading = collectionsLoading || payoutsLoading;
  const error = collectionsError?.message || payoutsError?.message || null;

  // Process transactions
  const transactions = useMemo(() => {
    const collections = (collectionsData?.collections || []).map((c) => ({
      ...c,
      type: "Collection",
      date: c.collection_date,
      amount: c.amount_paid,
      method: c.collection_method,
      plan_amount: c.expected_amount || 0,
    }));

    const payouts = (payoutsData?.payouts || [])
      .filter((p) => p.paid_date)
      .map((p) => ({
        ...p,
        type: "Payout",
        date: p.paid_date,
        amount: p.amount,
        planned: p.planned_amount,
        method: p.method,
      }));

    return [...collections, ...payouts].sort(
      (a, b) => {
        const dateA = a.date ? new Date(a.date) : new Date('2999-01-01');
        const dateB = b.date ? new Date(b.date) : new Date('2999-01-01');
        return dateB - dateA;
      }
    );
  }, [collectionsData, payoutsData]);

  const filteredTransactions = useMemo(() => {
    let data = transactions;
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      data = data.filter((t) => {
        const amountMatch = (t.amount || 0).toString().includes(lowercasedQuery);
        const methodMatch = (t.method || "").toLowerCase().includes(lowercasedQuery);
        const typeMatch = t.type.toLowerCase().includes(lowercasedQuery);

        // Check for member or chit name depending on context
        const entityName = t.member?.full_name || t.chit?.name || "";
        const entityMatch = entityName.toLowerCase().includes(lowercasedQuery);

        return amountMatch || methodMatch || typeMatch || entityMatch;
      });
    }
    return data;
  }, [transactions, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  const handleLogPayment = () => {
    // If we are in member view, pass memberId
    // If we are in chit view, pass chitId
    navigate("/ledger/create", {
      state: {
        chitId: chitId ? parseInt(chitId) : undefined,
        memberId: memberId ? parseInt(memberId) : undefined,
        type: "collection"
      }
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const columns = useMemo(() => [
    {
      header: "S.No",
      cell: (row, index) => (currentPage - 1) * ITEMS_PER_PAGE + index + 1,
      className: "text-center w-16",
    },
    {
      header: "Type",
      className: "text-center",
      cell: (row) => (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${row.type === "Collection"
            ? "bg-success-bg text-success-accent"
            : "bg-error-bg text-error-accent"
            }`}
        >
          {row.type === "Collection" ? (
            <>
              <ArrowDownLeft className="w-3 h-3" /> In
            </>
          ) : (
            <>
              <ArrowUpRight className="w-3 h-3" /> Out
            </>
          )}
        </span>
      ),
    },
    {
      header: "Date",
      accessor: "date",
      cell: (row) => row.date ? formatDate(row.date) : "Pending",
      className: "text-center",
    },
    // Show Chit Name if in Member View
    ...(memberId ? [{
      header: "Chit",
      accessor: "chit.name",
      className: "text-left",
      cell: (row) => row.chit?.name || "-"
    }] : []),
    // Show Member Name if in Chit View
    ...(chitId ? [{
      header: "Member",
      accessor: "member.full_name",
      className: "text-center",
      cell: (row) => row.member?.full_name || "-"
    }] : []),
    {
      header: "Amount",
      accessor: "amount",
      cell: (row) => (
        <span className={`font-bold ${row.type === 'Collection' ? 'text-success-accent' : 'text-error-accent'}`}>
          {row.type === 'Collection' ? "+" : "-"}₹{row.amount?.toLocaleString("en-IN")}
        </span>
      ),
      className: "text-center font-medium",
    },
    {
      header: "Method",
      accessor: "method",
      className: "text-center",
      cell: (row) => row.method || "-"
    },
  ], [currentPage, memberId, chitId]);

  return (
    <div className="flex-1 flex flex-col">
      <div className="relative flex justify-center items-center mb-4">
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <Receipt className="w-6 h-6" /> Payments
        </h2>

        {mode !== "view" && (
          <button
            onClick={handleLogPayment}
            className="absolute right-0 flex items-center gap-1.5 px-3 py-1.5 bg-success-bg text-success-accent hover:bg-success-accent hover:text-white rounded-full transition-all duration-200 text-sm font-medium"
            title="Log Payment"
          >
            <Plus className="w-4 h-4" /> Log Payment
          </button>
        )}
      </div>
      <hr className="border-border mb-4" />

      {error && <Message type="error">{error}</Message>}

      {loading && !transactions.length ? (
        <div className="p-4">
          <Skeleton.Table rows={5} columns={6} />
        </div>
      ) : (
        <>
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative flex items-center">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="w-5 h-5 text-text-secondary" />
              </span>
              <div className="absolute left-10 h-6 w-px bg-border"></div>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-12 pr-4 py-3 bg-background-secondary border rounded-md focus:outline-none focus:ring-2 border-border focus:ring-accent"
              />
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="w-16 h-16 mb-4 rounded-full bg-background-secondary flex items-center justify-center">
                <WalletMinimal className="w-8 h-8 text-text-secondary" />
              </div>
              <p className="text-text-secondary text-center text-sm">
                {searchQuery
                  ? "No payments match your search"
                  : "No payments recorded yet"}
              </p>
            </div>
          ) : (
            <>
              {/* Table View */}
              <div className="block overflow-x-auto">
                <Table
                  columns={columns}
                  data={paginatedTransactions}
                  variant="secondary"
                  onRowClick={(row) => {
                    navigate(`/ledger/edit/${row.id}`, { state: { type: row.type.toLowerCase() } });
                  }}
                />
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default CollectionHistoryList;
