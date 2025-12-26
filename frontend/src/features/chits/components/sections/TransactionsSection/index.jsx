// frontend/src/features/chits/components/sections/TransactionsSection/index.jsx

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import Table from "../../../../../components/ui/Table";
import Pagination from "../../../../../components/ui/Pagination";
import Message from "../../../../../components/ui/Message";
import Skeleton from "../../../../../components/ui/Skeleton";
import StatusBadge from "../../../../../components/ui/StatusBadge";
import Button from "../../../../../components/ui/Button";
import TabButton from "../../../../../components/ui/TabButton";
import ConfirmationModal from "../../../../../components/ui/ConfirmationModal";
import TransactionStats from "./components/TransactionStats";
import CollectionForm from "./components/CollectionForm";
import PayoutForm from "./components/PayoutForm";
import { formatAmount, formatDate, ITEMS_PER_PAGE } from "./utils/helpers";
import AuctionsSection from "../AuctionsSection";

import {
    useCollectionsByChit,
    useDeleteCollection,
    collectionKeys,
} from "../../../../collections/hooks/useCollections";
import {
    usePayoutsByChit,
    useDeletePayout,
    payoutKeys,
} from "../../../../payouts/hooks/usePayouts";
import { useAssignmentsByChit } from "../../../../assignments/hooks/useAssignments";
import { useChitDetails } from "../../../hooks/useChits";

import {
    Search,
    Receipt,
    ArrowLeft,
    ArrowDownLeft,
    ArrowUpRight,
    BookOpen,
    Plus,
    SquarePen,
    Trash2,
    WalletMinimal,
    TrendingUp,
    Gavel,
} from "lucide-react";

const TABS = ["all", "collections", "payouts"];

/**
 * TransactionsSection - Chit-scoped financial activity hub
 * Combines Collections (money in) and Payouts (money out) with inline forms
 */
const TransactionsSection = ({ mode, chitId }) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const formRef = useRef(null);

    // --- UI State ---
    const [activeTab, setActiveTab] = useState("all");
    const [view, setView] = useState("list"); // list | add_collection | add_payout
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [success, setSuccess] = useState(null);
    const [localError, setLocalError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [deleteType, setDeleteType] = useState(null); // 'collection' or 'payout'

    // --- React Query Hooks ---
    const {
        data: collectionsResponse,
        isLoading: collectionsLoading,
        error: collectionsError,
        refetch: refetchCollections,
    } = useCollectionsByChit(chitId);

    const {
        data: payoutsResponse,
        isLoading: payoutsLoading,
        error: payoutsError,
        refetch: refetchPayouts,
    } = usePayoutsByChit(chitId);

    const {
        data: assignmentsResponse,
        isLoading: assignmentsLoading,
    } = useAssignmentsByChit(chitId);

    const {
        data: chitData,
        isLoading: chitLoading,
    } = useChitDetails(chitId);

    const deleteCollectionMutation = useDeleteCollection();
    const deletePayoutMutation = useDeletePayout();

    // --- Extract Data ---
    const collections = collectionsResponse?.collections ?? [];
    const payouts = payoutsResponse?.payouts ?? [];
    const assignments = assignmentsResponse?.assignments ?? [];
    const chitStartDate = chitData?.start_date ?? null;

    const loading = collectionsLoading || payoutsLoading || assignmentsLoading || chitLoading;
    const error = localError || collectionsError?.message || payoutsError?.message || null;

    // --- Build unified transactions list for "All" tab ---
    const allTransactions = useMemo(() => {
        const collectionItems = collections.map((c) => ({
            id: c.id,
            type: "collection",
            date: c.collection_date,
            member: c.member?.full_name || "-",
            amount: c.amount_paid || 0,
            method: c.collection_method,
            status: "Paid",
            original: c,
        }));

        const payoutItems = payouts
            .filter((p) => p.paid_date) // Only show paid payouts
            .map((p) => ({
                id: p.id,
                type: "payout",
                date: p.paid_date,
                member: p.member?.full_name || "-",
                amount: p.amount || 0,
                method: p.method,
                status: "Paid",
                original: p,
            }));

        // Sort by date descending
        return [...collectionItems, ...payoutItems].sort(
            (a, b) => new Date(b.date) - new Date(a.date)
        );
    }, [collections, payouts]);

    // --- Effects ---
    useEffect(() => {
        setCurrentPage(1);
        setSearchQuery("");
        setStatusFilter(null);
    }, [activeTab]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter]);

    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    // --- Get current data based on tab ---
    const currentData = useMemo(() => {
        if (activeTab === "collections") return collections;
        if (activeTab === "payouts") return payouts;
        return allTransactions;
    }, [activeTab, collections, payouts, allTransactions]);

    // --- Filter & Search ---
    const filteredData = useMemo(() => {
        let data = currentData;

        // Search
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            if (activeTab === "all") {
                data = data.filter(
                    (t) =>
                        t.member.toLowerCase().includes(lowerQuery) ||
                        t.amount.toString().includes(lowerQuery)
                );
            } else if (activeTab === "collections") {
                data = data.filter(
                    (c) =>
                        c.member?.full_name?.toLowerCase().includes(lowerQuery) ||
                        c.amount_paid?.toString().includes(lowerQuery)
                );
            } else {
                data = data.filter(
                    (p) =>
                        p.member?.full_name?.toLowerCase().includes(lowerQuery) ||
                        (p.amount || 0).toString().includes(lowerQuery)
                );
            }
        }

        // Status filter for "All" tab
        if (statusFilter && activeTab === "all") {
            data = data.filter((t) => t.type === statusFilter);
        }

        return data;
    }, [currentData, searchQuery, statusFilter, activeTab]);

    // --- Pagination ---
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredData.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredData, currentPage]);

    // --- Handlers ---
    const handleViewChange = (newView) => {
        setView(newView);
    };

    const handleBackNavigation = () => {
        if (formRef.current && typeof formRef.current.goBack === "function") {
            formRef.current.goBack();
        } else {
            handleViewChange("list");
        }
    };

    const handleAddClick = (type) => {
        if (mode === "view") {
            navigate(`/chits/edit/${chitId}`, { state: { initialTab: "transactions" } });
        } else {
            handleViewChange(type === "collection" ? "add_collection" : "add_payout");
        }
    };

    const handleDeleteClick = (item, type) => {
        setItemToDelete(item);
        setDeleteType(type);
        setIsModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        setLocalError(null);

        const mutation = deleteType === "collection" ? deleteCollectionMutation : deletePayoutMutation;

        mutation.mutate(itemToDelete.id, {
            onSuccess: () => {
                setSuccess(`${deleteType === "collection" ? "Collection" : "Payout"} deleted successfully.`);
                setIsModalOpen(false);
                setItemToDelete(null);
                setDeleteType(null);
            },
            onError: (err) => {
                setLocalError(err.message);
                setIsModalOpen(false);
                setItemToDelete(null);
                setDeleteType(null);
            },
        });
    };

    const handleFormSuccess = async () => {
        await Promise.all([refetchCollections(), refetchPayouts()]);
        handleViewChange("list");
    };

    // --- Table Columns ---
    const allColumns = useMemo(
        () => [
            {
                header: "S.No",
                className: "text-center",
                cell: (_, index) => (currentPage - 1) * ITEMS_PER_PAGE + index + 1,
            },
            {
                header: "Type",
                className: "text-center",
                cell: (row) => (
                    <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${row.type === "collection"
                            ? "bg-success-bg text-success-accent"
                            : "bg-error-bg text-error-accent"
                            }`}
                    >
                        {row.type === "collection" ? (
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
                className: "text-center",
                cell: (row) => formatDate(row.date),
            },
            {
                header: "Member",
                className: "text-center",
                cell: (row) => row.member,
            },
            {
                header: "Amount",
                className: "text-center",
                cell: (row) => (
                    <span
                        className={
                            row.type === "collection" ? "text-success-accent" : "text-error-accent"
                        }
                    >
                        {row.type === "collection" ? "+" : "-"}₹{formatAmount(row.amount)}
                    </span>
                ),
            },
            {
                header: "Method",
                className: "text-center",
                cell: (row) => row.method || "-",
            },
        ],
        [currentPage]
    );

    const collectionsColumns = useMemo(
        () => [
            {
                header: "S.No",
                className: "text-center",
                cell: (_, index) => (currentPage - 1) * ITEMS_PER_PAGE + index + 1,
            },
            {
                header: "Date",
                className: "text-center",
                cell: (row) => formatDate(row.collection_date),
            },
            {
                header: "Member",
                className: "text-center",
                cell: (row) => row.member?.full_name || "-",
            },
            {
                header: "Amount",
                className: "text-center",
                cell: (row) => (
                    <span className="text-success-accent">
                        ₹{formatAmount(row.amount_paid)}
                    </span>
                ),
            },
            {
                header: "Method",
                className: "text-center",
                cell: (row) => row.collection_method || "-",
            },
            ...(mode !== "view"
                ? [
                    {
                        header: "Actions",
                        className: "text-center",
                        cell: (row) => (
                            <div className="flex items-center justify-center space-x-1">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/collections/edit/${row.id}`);
                                    }}
                                    className="p-1.5 text-sm rounded-md text-warning-accent hover:bg-warning-accent hover:text-white transition-colors duration-200"
                                    title="Edit"
                                >
                                    <SquarePen className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteClick(row, "collection");
                                    }}
                                    className="p-1.5 text-sm rounded-md text-error-accent hover:bg-error-accent hover:text-white transition-colors duration-200"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ),
                    },
                ]
                : []),
        ],
        [currentPage, mode, navigate]
    );

    const payoutsColumns = useMemo(
        () => [
            {
                header: "S.No",
                className: "text-center",
                cell: (_, index) => (currentPage - 1) * ITEMS_PER_PAGE + index + 1,
            },
            {
                header: "Month",
                className: "text-center",
                cell: (row) => row.month,
            },
            {
                header: "Member",
                className: "text-center",
                cell: (row) => row.member?.full_name || "-",
            },
            {
                header: "Planned",
                className: "text-center",
                cell: (row) =>
                    row.planned_amount ? (
                        <span className="text-text-secondary">₹{formatAmount(row.planned_amount)}</span>
                    ) : (
                        "-"
                    ),
            },
            {
                header: "Paid",
                className: "text-center",
                cell: (row) =>
                    row.amount ? (
                        <span className="text-error-accent">₹{formatAmount(row.amount)}</span>
                    ) : (
                        "-"
                    ),
            },
            {
                header: "Status",
                className: "text-center",
                cell: (row) => (
                    <StatusBadge status={row.paid_date ? "Paid" : "Pending"} />
                ),
            },
            ...(mode !== "view"
                ? [
                    {
                        header: "Actions",
                        className: "text-center",
                        cell: (row) => (
                            <div className="flex items-center justify-center space-x-1">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/payouts/edit/${row.id}`);
                                    }}
                                    className="p-1.5 text-sm rounded-md text-warning-accent hover:bg-warning-accent hover:text-white transition-colors duration-200"
                                    title="Edit"
                                >
                                    <SquarePen className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteClick(row, "payout");
                                    }}
                                    className="p-1.5 text-sm rounded-md text-error-accent hover:bg-error-accent hover:text-white transition-colors duration-200"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ),
                    },
                ]
                : []),
        ],
        [currentPage, mode, navigate]
    );

    const columns = activeTab === "collections" ? collectionsColumns : activeTab === "payouts" ? payoutsColumns : allColumns;

    // --- Filter Chip Styles ---
    const chipBaseClass =
        "px-2.5 py-1 rounded-full text-xs font-medium transition-colors duration-200 cursor-pointer whitespace-nowrap";
    const chipSelectedClass = "bg-accent text-white";
    const chipUnselectedClass =
        "bg-background-tertiary text-text-secondary hover:bg-background-secondary hover:text-text-primary border border-border";

    // --- Render Content ---
    const renderContent = () => {
        if (activeTab === "auctions") {
            return <AuctionsSection chitId={chitId} mode={mode} />;
        }

        if (view === "add_collection") {
            return (
                <CollectionForm
                    ref={formRef}
                    chitId={chitId}
                    assignments={assignments}
                    onCollectionCreated={handleFormSuccess}
                    onBackToList={() => handleViewChange("list")}
                />
            );
        }

        if (view === "add_payout") {
            return (
                <PayoutForm
                    ref={formRef}
                    chitId={chitId}
                    payouts={payouts}
                    assignments={assignments}
                    chitStartDate={chitStartDate}
                    onPayoutRecorded={handleFormSuccess}
                    onBackToList={() => handleViewChange("list")}
                />
            );
        }

        return (
            <>
                {/* Action Buttons */}
                {mode !== "view" && (
                    <div className="mb-4">
                        <div className="p-3 bg-background-secondary rounded-xl shadow-sm border border-border">
                            <div className="flex items-center justify-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => handleAddClick("collection")}
                                    className="p-2.5 rounded-full bg-success-bg text-success-accent hover:bg-success-accent hover:text-white hover:scale-110 transition-all duration-200 shadow-sm"
                                    title="Log Collection"
                                >
                                    <WalletMinimal className="w-5 h-5" />
                                </button>
                                <div className="h-8 w-px bg-border"></div>
                                <button
                                    type="button"
                                    onClick={() => handleAddClick("payout")}
                                    className="p-2.5 rounded-full bg-error-bg text-error-accent hover:bg-error-accent hover:text-white hover:scale-110 transition-all duration-200 shadow-sm"
                                    title="Record Payout"
                                >
                                    <TrendingUp className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {loading && !currentData.length ? (
                    <div className="p-4">
                        <Skeleton.Table rows={5} columns={5} />
                    </div>
                ) : (
                    <>
                        {/* Search & Filter */}
                        <div className="mb-3 flex flex-col gap-3">
                            {/* Search Bar */}
                            <div className="relative flex items-center">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                    <Search className="w-5 h-5 text-text-secondary" />
                                </span>
                                <div className="absolute left-10 h-6 w-px bg-border"></div>
                                <input
                                    type="text"
                                    placeholder="Search by member or amount..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-background-secondary border rounded-md focus:outline-none focus:ring-2 border-border focus:ring-accent"
                                />
                            </div>

                            {/* Filter Chips for "All" tab */}
                            {activeTab === "all" && (
                                <div className="flex overflow-x-auto gap-2 no-scrollbar">
                                    <button
                                        type="button"
                                        onClick={() => setStatusFilter(null)}
                                        className={`${chipBaseClass} ${statusFilter === null ? chipSelectedClass : chipUnselectedClass
                                            }`}
                                    >
                                        All
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStatusFilter("collection")}
                                        className={`${chipBaseClass} ${statusFilter === "collection" ? chipSelectedClass : chipUnselectedClass
                                            }`}
                                    >
                                        Collections
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStatusFilter("payout")}
                                        className={`${chipBaseClass} ${statusFilter === "payout" ? chipSelectedClass : chipUnselectedClass
                                            }`}
                                    >
                                        Payouts
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Empty State */}
                        {filteredData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 px-4">
                                <div className="w-16 h-16 mb-4 rounded-full bg-background-secondary flex items-center justify-center">
                                    {activeTab === "collections" ? (
                                        <WalletMinimal className="w-8 h-8 text-text-secondary" />
                                    ) : activeTab === "payouts" ? (
                                        <TrendingUp className="w-8 h-8 text-text-secondary" />
                                    ) : (
                                        <BookOpen className="w-8 h-8 text-text-secondary" />
                                    )}
                                </div>
                                <p className="text-text-secondary text-center text-sm">
                                    {searchQuery
                                        ? "No transactions match your search"
                                        : activeTab === "collections"
                                            ? "No collections recorded yet"
                                            : activeTab === "payouts"
                                                ? "No payouts recorded yet"
                                                : "No transactions yet"}
                                </p>
                                {mode !== "view" && !searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleAddClick(activeTab === "payouts" ? "payout" : "collection")
                                        }
                                        className="mt-3 text-accent text-sm hover:underline flex items-center gap-1"
                                    >
                                        <Plus className="w-4 h-4" />
                                        {activeTab === "payouts" ? "Record Payout" : "Log Collection"}
                                    </button>
                                )}
                            </div>
                        ) : (
                            <>
                                {/* Table */}
                                <div className="block">
                                    <Table
                                        columns={columns}
                                        data={paginatedData}
                                        variant="secondary"
                                        onRowClick={(row) => {
                                            if (activeTab === "all") {
                                                navigate(
                                                    row.type === "collection"
                                                        ? `/collections/view/${row.id}`
                                                        : `/payouts/view/${row.id}`
                                                );
                                            } else if (activeTab === "collections") {
                                                navigate(`/collections/view/${row.id}`);
                                            } else {
                                                navigate(`/payouts/view/${row.id}`);
                                            }
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
            </>
        );
    };

    // --- Header ---
    const getHeaderTitle = () => {
        if (view === "add_collection") return "Log Collection";
        if (view === "add_payout") return "Record Payout";
        return "Transactions";
    };

    const getHeaderIcon = () => {
        if (view === "add_collection") return WalletMinimal;
        if (view === "add_payout") return TrendingUp;
        return Receipt;
    };

    const HeaderIcon = getHeaderIcon();

    return (
        <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="relative flex justify-center items-center mb-2">
                {view !== "list" && (
                    <button
                        onClick={handleBackNavigation}
                        className="absolute left-0 text-text-primary hover:text-accent"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                )}
                <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                    <HeaderIcon className="w-6 h-6" /> {getHeaderTitle()}
                </h2>
                {mode === "view" && view === "list" && (
                    <button
                        onClick={() => navigate(`/chits/edit/${chitId}`, { state: { initialTab: "transactions" } })}
                        className="absolute right-0 p-1 text-success-accent hover:bg-success-bg rounded-full transition-colors duration-200 print:hidden"
                        title="Edit Transactions"
                    >
                        <SquarePen className="w-5 h-5" />
                    </button>
                )}
            </div>
            <hr className="border-border mb-4" />

            {/* Success/Error Messages */}
            {success && <Message type="success">{success}</Message>}
            {error && (
                <Message type="error" onClose={() => setLocalError(null)}>
                    {error}
                </Message>
            )}

            {/* Stats - only in list view */}
            {view === "list" && (
                <TransactionStats
                    collections={collections}
                    payouts={payouts}
                    isLoading={loading}
                />
            )}

            {/* Sub-Tabs - only in list view */}
            {view === "list" && (
                <div className="flex items-center border-b border-border mb-4 overflow-x-auto whitespace-nowrap no-scrollbar">
                    <TabButton
                        name="all"
                        icon={BookOpen}
                        label="All"
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                    />
                    <TabButton
                        name="collections"
                        icon={ArrowDownLeft}
                        label="Collections"
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                    />
                    <TabButton
                        name="payouts"
                        icon={ArrowUpRight}
                        label="Payouts"
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                    />
                    {chitData?.chit_type === "auction" && (
                        <TabButton
                            name="auctions"
                            icon={Gavel}
                            label="Auctions"
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                        />
                    )}
                </div>
            )}

            {renderContent()}

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title={deleteType === "collection" ? "Delete Collection?" : "Delete Payout?"}
                message={`Are you sure you want to delete this ${deleteType}? This action cannot be undone.`}
                confirmText="Delete"
                loading={deleteCollectionMutation.isPending || deletePayoutMutation.isPending}
            />
        </div>
    );
};

export default TransactionsSection;
