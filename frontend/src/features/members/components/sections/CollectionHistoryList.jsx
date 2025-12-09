// frontend/src/features/members/components/sections/CollectionHistoryList.jsx

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import Table from "../../../../components/ui/Table";
import Message from "../../../../components/ui/Message";
import Button from "../../../../components/ui/Button";
import CollectionDetailsForm from "../../../collections/components/forms/CollectionDetailsForm";
import Card from "../../../../components/ui/Card";
import {
  Loader2,
  AlertCircle,
  Search,
  Plus,
  ArrowLeft,
  ArrowRight,
  IndianRupee,
  LayoutGrid,
  List,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import {
  useCollectionsByChit,
  useCollectionsByMember,
  useCreateCollection,
  collectionKeys,
} from "../../../collections/hooks/useCollections";
import {
  usePayoutsByChit,
  usePayoutsByMember,
} from "../../../payouts/hooks/usePayouts";
import { createCollection } from "../../../../services/collectionsService";
import CollectionHistoryCard from "../../../collections/components/cards/CollectionHistoryCard";
import useScrollToTop from "../../../../hooks/useScrollToTop";

const ITEMS_PER_PAGE = 10;

/**
 * CollectionHistoryList component - displays transaction history (collections and payouts).
 * Uses React Query for data fetching and caching.
 */
const CollectionHistoryList = ({
  chitId,
  memberId,
  mode,
  collectionDefaults,
  setCollectionDefaults,
  onManage,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState("list");
  const [layoutMode, setLayoutMode] = useState("table");
  const [currentPage, setCurrentPage] = useState(1);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    chit_assignment_id: "",
    amount_paid: "",
    collection_date: new Date().toISOString().split("T")[0],
    collection_method: "Cash",
    notes: "",
  });

  useScrollToTop(formSuccess || formError);

  const viewType = chitId ? "chit" : "member";

  // React Query hooks for collections
  const {
    data: collectionsDataByChit,
    isLoading: collectionsChitLoading,
    error: collectionsChitError,
    refetch: refetchCollectionsByChit,
  } = useCollectionsByChit(chitId);

  const {
    data: collectionsDataByMember,
    isLoading: collectionsMemberLoading,
    error: collectionsMemberError,
    refetch: refetchCollectionsByMember,
  } = useCollectionsByMember(memberId);

  // React Query hooks for payouts
  const {
    data: payoutsDataByChit,
    isLoading: payoutsChitLoading,
  } = usePayoutsByChit(chitId);

  const {
    data: payoutsDataByMember,
    isLoading: payoutsMemberLoading,
  } = usePayoutsByMember(memberId);

  // Determine which data to use based on chitId or memberId
  const collectionsData = chitId ? collectionsDataByChit : collectionsDataByMember;
  const payoutsData = chitId ? payoutsDataByChit : payoutsDataByMember;
  const collectionsLoading = chitId ? collectionsChitLoading : collectionsMemberLoading;
  const payoutsLoading = chitId ? payoutsChitLoading : payoutsMemberLoading;
  const collectionsError = chitId ? collectionsChitError : collectionsMemberError;

  const loading = collectionsLoading || payoutsLoading;
  const error = collectionsError?.message ?? null;

  // Process transactions
  const transactions = useMemo(() => {
    const collections = (collectionsData?.collections || []).map((c) => ({
      ...c,
      type: "Collection",
      date: c.collection_date,
      amount: c.amount_paid,
      method: c.collection_method,
    }));

    const payouts = (payoutsData?.payouts || [])
      .filter((p) => p.paid_date) // Only show paid
      .map((p) => ({
        ...p,
        type: "Payout",
        date: p.paid_date,
        amount: p.amount,
        method: p.method,
      }));

    return [...collections, ...payouts].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
  }, [collectionsData, payoutsData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (formSuccess) {
      const timer = setTimeout(() => setFormSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [formSuccess]);

  useEffect(() => {
    if (collectionDefaults) {
      setView("create");
      setFormData((prev) => ({
        ...prev,
        chit_assignment_id: collectionDefaults.assignmentId,
        collection_date: new Date().toISOString().split("T")[0],
        collection_method: "Cash",
        amount_paid: "",
        notes: "",
      }));
      setFormError(null);
      setFormSuccess(null);
    }
  }, [collectionDefaults]);

  const handleAddCollectionClick = () => {
    if (mode === "view" && chitId) {
      navigate(`/chits/edit/${chitId}`, {
        state: { initialTab: "collections" },
      });
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const filteredTransactions = useMemo(() => {
    if (!searchQuery) return transactions;
    const lowercasedQuery = searchQuery.toLowerCase();
    return transactions.filter((t) => {
      const amountMatch = t.amount.toString().includes(lowercasedQuery);
      const method = t.method || "";
      const methodMatch = method.toLowerCase().includes(lowercasedQuery);
      const typeMatch = t.type.toLowerCase().includes(lowercasedQuery);

      if (viewType === "chit") {
        const memberMatch = t.member.full_name
          .toLowerCase()
          .includes(lowercasedQuery);
        return memberMatch || amountMatch || methodMatch || typeMatch;
      } else {
        const chitMatch = t.chit.name.toLowerCase().includes(lowercasedQuery);
        return chitMatch || amountMatch || methodMatch || typeMatch;
      }
    });
  }, [transactions, searchQuery, viewType]);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions =
    mode === "view"
      ? filteredTransactions.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
      )
      : filteredTransactions;

  const searchPlaceholder =
    viewType === "chit"
      ? "Search member, type, amount..."
      : "Search chit, type, amount...";

  const columns = [
    {
      header: "S.No",
      cell: (row, index) =>
        (mode === "view" ? (currentPage - 1) * ITEMS_PER_PAGE : 0) + index + 1,
      className: "text-center w-16",
    },
    {
      header: "Date",
      accessor: "date",
      cell: (row) => formatDate(row.date),
      className: "text-center",
    },
    ...(memberId
      ? [
        {
          header: "Chit",
          accessor: "chit.name",
          className: "text-left",
        },
      ]
      : []),
    ...(chitId
      ? [
        {
          header: "Member",
          accessor: "member.full_name",
          className: "text-center",
        },
      ]
      : []),
    {
      header: "Type",
      accessor: "type",
      className: "text-center",
      cell: (row) => (
        <div className="flex items-center justify-center gap-1">
          {row.type === "Collection" ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-success-bg text-success-accent text-xs font-semibold">
              <ArrowDownLeft className="w-3 h-3" /> Collection
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-error-bg text-error-accent text-xs font-semibold">
              <ArrowUpRight className="w-3 h-3" /> Payout
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Amount",
      accessor: "amount",
      cell: (row) => `₹${row.amount.toLocaleString("en-IN")}/-`,
      className: "text-center font-medium",
      conditionalStyle: (row) =>
        row.type === "Collection"
          ? { color: "var(--color-success-accent)" }
          : { color: "var(--color-error-accent)" },
    },
    {
      header: "Method",
      accessor: "method",
      className: "text-center",
    },
    {
      header: "Notes",
      accessor: "notes",
      className: "text-center truncate max-w-xs",
      cell: (row) => <span title={row.notes}>{row.notes || "-"}</span>,
    },
  ];

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormError(null);
    setFormSuccess(null);
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setFormLoading(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const dataToSend = {
        ...formData,
        amount_paid: parseFloat(formData.amount_paid.replace(/,/g, "")),
        chit_assignment_id: parseInt(formData.chit_assignment_id),
        collection_date: formData.collection_date,
        collection_method: formData.collection_method,
      };

      await createCollection(dataToSend);
      setFormSuccess("Collection logged successfully!");
      setFormData({
        chit_assignment_id: "",
        amount_paid: "",
        collection_date: new Date().toISOString().split("T")[0],
        collection_method: "Cash",
        notes: "",
      });
      setView("list");

      // Refetch data
      if (chitId) {
        await refetchCollectionsByChit();
      } else if (memberId) {
        await refetchCollectionsByMember();
      }

      if (setCollectionDefaults) {
        setCollectionDefaults(null);
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleShowForm = () => {
    setView("create");
    setFormError(null);
    setFormSuccess(null);
    if (setCollectionDefaults) {
      setCollectionDefaults(null);
    }
  };

  const handleShowList = () => {
    setView("list");
    setFormError(null);
    if (setCollectionDefaults) {
      setCollectionDefaults(null);
    }
  };

  const headerTitle = view === "list" ? "Transactions" : "Log New Collection";

  if (loading) {
    return (
      <Card className="flex-1 flex flex-col">
        <div className="flex justify-center items-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </Card>
    );
  }

  if (error) {
    return <Message type="error">{error}</Message>;
  }

  return (
    <Card className="flex-1 flex flex-col">
      <div className="relative flex justify-center items-center mb-2">
        {view === "create" && (
          <button
            type="button"
            onClick={handleShowList}
            className="absolute left-0 text-text-primary hover:text-accent"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <IndianRupee className="w-6 h-6 text-green-600" /> {headerTitle}
        </h2>

        {mode === "view" && view === "list" && (
          <button
            onClick={onManage || handleAddCollectionClick}
            className="absolute right-0 p-1 text-success-accent hover:bg-success-bg rounded-full transition-colors duration-200 print:hidden"
            title="Add Collection"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>
      <hr className="border-border mb-4" />

      {view === "create" ? (
        <form onSubmit={handleFormSubmit}>
          {formSuccess && <Message type="success">{formSuccess}</Message>}
          {formError && (
            <Message type="error" onClose={() => setFormError(null)}>
              {formError}
            </Message>
          )}

          <CollectionDetailsForm
            mode="create"
            formData={formData}
            onFormChange={handleFormChange}
            defaultAssignmentId={collectionDefaults?.assignmentId}
            defaultChitId={collectionDefaults?.chitId || chitId}
            defaultMemberId={collectionDefaults?.memberId || memberId}
          />
          <div className="flex justify-end mt-6">
            <Button
              type="submit"
              variant="success"
              disabled={formLoading}
              className="w-full"
            >
              {formLoading ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                <>
                  <Plus className="w-5 h-5 inline-block mr-2" />
                  Submit Collection
                </>
              )}
            </Button>
          </div>
        </form>
      ) : (
        <>
          {formSuccess && <Message type="success">{formSuccess}</Message>}
          {mode !== "view" && (
            <div className="mb-4">
              <Button
                variant="primary"
                className="w-full md:w-auto flex items-center justify-center"
                onClick={handleShowForm}
              >
                <IndianRupee className="w-6 h-6 text-green-600" /> Log New
                Collection
              </Button>
            </div>
          )}

          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto h-8 w-8 text-text-secondary opacity-50" />
              <p className="mt-2 text-sm text-text-secondary">
                No transactions recorded yet.
              </p>
            </div>
          ) : (
            <>
              {/* --- CONTROLS ROW: Search + Layout Toggle --- */}
              <div className="flex flex-row gap-2 items-stretch justify-between mb-4">
                {transactions.length > 1 ? (
                  <div className="relative flex-grow">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                      <Search className="w-5 h-5 text-text-secondary" />
                    </span>
                    <div className="absolute left-10 h-6 w-px bg-border my-auto top-0 bottom-0"></div>
                    <input
                      type="text"
                      placeholder={searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-background-secondary border rounded-md focus:outline-none focus:ring-2 border-border focus:ring-accent"
                    />
                  </div>
                ) : (
                  <div className="flex-grow"></div>
                )}

                <div className="flex-shrink-0">
                  <button
                    onClick={() =>
                      setLayoutMode((prev) =>
                        prev === "table" ? "grid" : "table"
                      )
                    }
                    className="h-full px-4 rounded-md bg-background-secondary text-text-secondary hover:bg-background-tertiary transition-all shadow-sm border border-border flex items-center justify-center"
                    title={
                      layoutMode === "table"
                        ? "Switch to Grid View"
                        : "Switch to Table View"
                    }
                  >
                    {layoutMode === "table" ? (
                      <LayoutGrid className="w-5 h-5" />
                    ) : (
                      <List className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {filteredTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <Search className="mx-auto h-8 w-8 text-text-secondary opacity-50" />
                  <p className="mt-2 text-sm text-text-secondary">
                    No transactions found matching "{searchQuery}".
                  </p>
                </div>
              ) : (
                <>
                  {/* --- TABLE VIEW --- */}
                  {layoutMode === "table" ? (
                    <div className="block overflow-x-auto">
                      <Table
                        columns={columns}
                        data={paginatedTransactions}
                        variant="secondary"
                        onRowClick={(row) => {
                          if (row.type === "Collection") {
                            navigate(`/collections/view/${row.id}`);
                          } else {
                            navigate(`/payouts/view/${row.id}`);
                          }
                        }}
                      />
                    </div>
                  ) : (
                    // --- GRID VIEW ---
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {paginatedTransactions.map((t) => (
                        <CollectionHistoryCard
                          key={`${t.type}-${t.id}`}
                          collection={{
                            ...t,
                            amount_paid: t.amount,
                            collection_date: t.date,
                          }}
                          viewType={viewType}
                          centered={mode === "view"}
                          onClick={() => {
                            if (t.type === "Collection") {
                              navigate(`/collections/view/${t.id}`);
                            } else {
                              navigate(`/payouts/view/${t.id}`);
                            }
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* --- PAGINATION --- */}
                  {mode === "view" && totalPages > 1 && (
                    <div className="flex justify-between items-center mt-4 w-full px-2 text-sm text-text-secondary">
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1}
                        className="p-2 rounded-full hover:bg-background-secondary hover:text-text-primary disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>

                      <span className="font-medium">
                        Page {currentPage} of {totalPages}
                      </span>

                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-full hover:bg-background-secondary hover:text-text-primary disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      >
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}
    </Card>
  );
};

export default CollectionHistoryList;
