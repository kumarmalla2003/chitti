import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Table from "../../../../../components/ui/Table";
import Pagination from "../../../../../components/ui/Pagination";
import Message from "../../../../../components/ui/Message";
import Skeleton from "../../../../../components/ui/Skeleton";
import ActionButton from "../../../../../components/ui/ActionButton";
import ConfirmationModal from "../../../../../components/ui/ConfirmationModal";
import { formatAmount, formatDate, ITEMS_PER_PAGE } from "./utils/helpers";

import { getPayments } from "../../../../../services/paymentsService";
import { useDeleteCollection } from "../../../../collections/hooks/useCollections";
import TransactionForm from "../../../../ledger/components/forms/TransactionForm";

import {
    Search,
    BookOpen,
    ArrowDownLeft,
    ArrowUpRight,
    Plus,
    WalletMinimal,
    TrendingUp,
    ArrowLeft,
    SquarePen,
    Trash2,
} from "lucide-react";

/**
 * LedgerSection - Detailed record of all collections and payouts
 * Displays a unified ledger with inline transaction recording.
 */
const LedgerSection = ({ mode, chitId }) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // --- UI State ---
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [typeFilter, setTypeFilter] = useState("all"); // all, collection, payout
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formType, setFormType] = useState("collection");
    const [selectedTransactionId, setSelectedTransactionId] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    // --- Data Fetching ---
    const {
        data: paymentsResponse,
        isLoading,
        error: queryError,
    } = useQuery({
        queryKey: ['payments', 'chit', chitId],
        queryFn: () => getPayments({ chit_id: chitId }),
        enabled: !!chitId,
    });

    // --- Delete Mutation ---
    const deleteMutation = useDeleteCollection();

    // --- Extract Data ---
    // API response structure: { payments: [...] } or [...]
    const allPayments = paymentsResponse?.payments || (Array.isArray(paymentsResponse) ? paymentsResponse : []) || [];

    const error = queryError?.message || deleteMutation.error?.message || null;

    // --- Build unified ledger ---
    const ledgerEntries = useMemo(() => {
        return allPayments.map((p) => {
            // Determine type (default to collection if not specified, though backend should send it)
            const type = p.payment_type || (p.slot_id ? 'payout' : 'collection');

            return {
                id: p.id,
                type: type,
                date: p.date,
                member: p.member?.full_name || "-",
                amount: p.amount || 0,
                method: p.method ? (p.method.charAt(0).toUpperCase() + p.method.slice(1).replace('_', ' ')) : "-",
                status: "Paid",
                original: p,
            };
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [allPayments]);

    // --- Filter & Search ---
    const filteredData = useMemo(() => {
        let data = ledgerEntries;

        // Apply type filter
        if (typeFilter !== "all") {
            data = data.filter((t) => t.type === typeFilter);
        }

        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            data = data.filter(
                (t) =>
                    t.member.toLowerCase().includes(lowerQuery) ||
                    t.amount.toString().includes(lowerQuery) ||
                    t.method?.toLowerCase().includes(lowerQuery)
            );
        }

        return data;
    }, [ledgerEntries, typeFilter, searchQuery]);

    // --- Pagination ---
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredData.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredData, currentPage]);

    // --- Handlers ---
    const handleRecordTransaction = () => {
        setFormType("collection");
        setSelectedTransactionId(null);
        setIsFormOpen(true);
    };

    const handleEdit = (transaction) => {
        setFormType(transaction.type);
        setSelectedTransactionId(transaction.id);
        setIsFormOpen(true);
    };

    const handleDelete = (transaction) => {
        setItemToDelete(transaction);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (itemToDelete) {
            await deleteMutation.mutateAsync(itemToDelete.id);
            queryClient.invalidateQueries({ queryKey: ['payments', 'chit', chitId] });
            setIsDeleteModalOpen(false);
            setItemToDelete(null);
        }
    };

    const handleFormSuccess = () => {
        setIsFormOpen(false);
        queryClient.invalidateQueries({ queryKey: ['payments', 'chit', chitId] });
    };

    const handleFormCancel = () => {
        setIsFormOpen(false);
        setSelectedTransactionId(null);
    };

    // --- Header Logic for Inline Form ---
    // Determine title based on edit mode
    let formTitle = "Transaction Details";
    if (isFormOpen) {
        if (selectedTransactionId) {
            formTitle = formType === "collection" ? "Edit Collection" : "Edit Payout";
        } else {
            formTitle = formType === "collection" ? "New Collection" : "New Payout";
        }
    }

    // --- Table Columns ---
    const columns = useMemo(
        () => [
            {
                header: "S.No",
                className: "text-center w-16",
                cell: (_, index) => (currentPage - 1) * ITEMS_PER_PAGE + index + 1,
            },
            {
                header: "Date",
                className: "text-center w-32",
                cell: (row) => formatDate(row.date),
            },
            {
                header: "Type",
                className: "text-center w-24",
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
                header: "Member",
                className: "text-center min-w-[200px]",
                cell: (row) => (
                    <span className="font-medium text-text-primary">
                        {row.member}
                    </span>
                ),
            },
            {
                header: "Amount",
                className: "text-center font-bold font-mono w-32",
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
                className: "text-center w-24",
                cell: (row) => (
                    <span className="text-text-secondary text-sm">
                        {row.method}
                    </span>
                ),
            },
            {
                header: "Actions",
                className: "text-center w-24",
                cell: (row) => (
                    <div className="flex items-center justify-center space-x-2">
                        <ActionButton
                            icon={SquarePen}
                            variant="warning"
                            title="Edit"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(row);
                            }}
                        />
                        <ActionButton
                            icon={Trash2}
                            variant="error"
                            title="Delete"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(row);
                            }}
                        />
                    </div>
                ),
            },
        ],
        [currentPage, mode]
    );

    // --- Filter Chip Styles ---
    const chipBaseClass = "px-2.5 py-1 rounded-full text-xs font-medium transition-colors duration-200 cursor-pointer whitespace-nowrap";
    const chipSelectedClass = "bg-accent text-white";
    const chipUnselectedClass = "bg-background-tertiary text-text-secondary hover:bg-background-secondary hover:text-text-primary border border-border";

    // --- Dynamic Headers ---
    const dynamicHeader = isFormOpen ? (
        <div className="space-y-4 mb-6">
            <div className="relative flex justify-center items-center">
                <button
                    onClick={handleFormCancel}
                    className="absolute left-0 p-2 rounded-full hover:bg-background-secondary transition-colors text-text-secondary hover:text-accent"
                    title="Back to Ledger"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>

                <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                    {formType === "collection" ? (
                        <WalletMinimal className="w-6 h-6 text-success-accent" />
                    ) : (
                        <TrendingUp className="w-6 h-6 text-error-accent" />
                    )}
                    {formTitle}
                </h2>
            </div>
            <hr className="border-border" />
        </div>
    ) : (
        <div className="flex flex-col">
            <div className="relative flex justify-center items-center mb-2">
                <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                    <BookOpen className="w-6 h-6" /> Ledger
                </h2>
                {mode !== "view" && (
                    <button
                        onClick={handleRecordTransaction}
                        className="absolute right-0 p-1 text-success-accent hover:bg-success-bg rounded-full transition-colors duration-200"
                        title="Record Transaction"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                )}
            </div>
            <hr className="border-border mb-4" />
        </div>
    );

    return (
        <div className="flex-1 flex flex-col">
            {/* Header */}
            {dynamicHeader}

            {/* Error Message */}
            {error && <Message type="error">{error}</Message>}

            {/* Inline Transaction Form */}
            {isFormOpen ? (
                <div className="animate-fade-in">
                    <TransactionForm
                        initialChitId={chitId}
                        initialType={formType}
                        transactionId={selectedTransactionId}
                        onSuccess={handleFormSuccess}
                        onCancel={handleFormCancel}
                        onTypeChange={setFormType}
                    />
                </div>
            ) : (
                <>
                    {isLoading && !ledgerEntries.length ? (
                        <div className="p-4">
                            <Skeleton.Table rows={5} columns={5} />
                        </div>
                    ) : (
                        <>
                            {/* Search & Filter Chips */}
                            <div className="mb-3 flex flex-col gap-3">
                                {/* Search Bar */}
                                <div className="relative flex items-center">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                        <Search className="w-5 h-5 text-text-secondary" />
                                    </span>
                                    <div className="absolute left-10 h-6 w-px bg-border"></div>
                                    <input
                                        type="text"
                                        placeholder="Search ledger by member, amount or method..."
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="w-full pl-12 pr-4 py-3 bg-background-secondary border rounded-md focus:outline-none focus:ring-2 border-border focus:ring-accent"
                                    />
                                </div>

                                {/* Filter Chips */}
                                <div className="flex overflow-x-auto gap-2 no-scrollbar">
                                    {[
                                        { value: "all", label: "All" },
                                        { value: "collection", label: "Collections" },
                                        { value: "payout", label: "Payouts" },
                                    ].map((chip) => {
                                        const isSelected = typeFilter === chip.value;
                                        return (
                                            <button
                                                key={chip.value}
                                                type="button"
                                                onClick={() => {
                                                    setTypeFilter(chip.value);
                                                    setCurrentPage(1);
                                                }}
                                                className={`${chipBaseClass} ${isSelected ? chipSelectedClass : chipUnselectedClass}`}
                                            >
                                                {chip.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Empty State */}
                            {filteredData.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 px-4">
                                    <div className="w-16 h-16 mb-4 rounded-full bg-background-secondary flex items-center justify-center">
                                        <BookOpen className="w-8 h-8 text-text-secondary" />
                                    </div>
                                    <p className="text-text-secondary text-center text-sm">
                                        {searchQuery
                                            ? "No entries match your search"
                                            : "No transactions recorded yet"}
                                    </p>
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
                                                handleEdit(row);
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
            )}
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Transaction"
                message={`Are you sure you want to delete this ${itemToDelete?.type}? This action cannot be undone.`}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                variant="error"
            />
        </div>
    );
};

export default LedgerSection;
