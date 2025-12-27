// frontend/src/features/ledger/pages/LedgerPage.jsx

import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import useScrollToTop from "../../../hooks/useScrollToTop";
import useTableKeyboardNavigation from "../../../hooks/useTableKeyboardNavigation";
import { useLedger } from "../hooks/useLedger";
import {
    useDeleteCollection,
} from "../../collections/hooks/useCollections";
import {
    useDeletePayout,
} from "../../payouts/hooks/usePayouts";

import Message from "../../../components/ui/Message";
import Button from "../../../components/ui/Button";
import Table from "../../../components/ui/Table";
import StatusBadge from "../../../components/ui/StatusBadge";
import Skeleton from "../../../components/ui/Skeleton";
import EmptyState from "../../../components/ui/EmptyState";
import PageHeader from "../../../components/ui/PageHeader";
import SearchToolbar from "../../../components/ui/SearchToolbar";
import ActionButton from "../../../components/ui/ActionButton";
import Pagination from "../../../components/ui/Pagination";
import StatsCard from "../../../components/ui/StatsCard";
import StatsCarousel from "../../../components/ui/StatsCarousel";
import FormattedCurrency from "../../../components/ui/FormattedCurrency";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";

import {
    Plus,
    SquarePen,
    Trash2,
    WalletMinimal,
    TrendingUp,
    ArrowDownLeft,
    ArrowUpRight,
    BookOpen,
} from "lucide-react";

const ITEMS_PER_PAGE = 10;
const VIEW_MODE_STORAGE_KEY = "ledgerViewMode";

const SORT_OPTIONS = [
    { value: "date_desc", label: "Date (Newest)" },
    { value: "date_asc", label: "Date (Oldest)" },
    { value: "amount_desc", label: "Amount (High-Low)" },
    { value: "amount_asc", label: "Amount (Low-High)" },
    { value: "member_asc", label: "Member (A-Z)" },
    { value: "member_desc", label: "Member (Z-A)" },
];

const FILTER_OPTIONS = [
    { value: "collection", label: "Collections (In)" },
    { value: "payout", label: "Payouts (Out)" },
];

const LedgerPage = () => {
    const navigate = useNavigate();
    const tableRef = useRef(null);

    const [success, setSuccess] = useState(null);
    const [localError, setLocalError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState(null);
    const [sortBy, setSortBy] = useState("date_desc");
    const [currentPage, setCurrentPage] = useState(1);

    // View mode (always table for ledger usually, but keeping logic)
    const viewMode = "table";

    // Modal states
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    // Data hooks
    const {
        allTransactions,
        collections,
        payouts,
        isLoading: loading,
        error: queryError,
    } = useLedger();

    const deleteCollectionMutation = useDeleteCollection();
    const deletePayoutMutation = useDeletePayout();

    const error = localError || (queryError?.message ?? null);

    useScrollToTop(success || error);

    // Handler to navigate to CREATE
    const handleLogTransaction = () => {
        navigate("/ledger/create");
    };

    // Delete handlers
    const handleDeleteClick = (item) => {
        setItemToDelete(item);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        setLocalError(null);

        const isCollection = itemToDelete.transactionType === "collection";
        const mutation = isCollection ? deleteCollectionMutation : deletePayoutMutation;

        mutation.mutate(itemToDelete.id, {
            onSuccess: () => {
                setSuccess(`${isCollection ? "Collection" : "Payout"} deleted successfully.`);
                setIsDeleteModalOpen(false);
                setItemToDelete(null);
            },
            onError: (err) => {
                setLocalError(err.message);
                setIsDeleteModalOpen(false);
                setItemToDelete(null);
            },
        });
    };

    // --- METRICS BLOCK ---
    const metricsBlock = useMemo(() => {
        if (loading) return null;

        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();

        // Monthly stats calculation logic (reused)
        const monthlyIn = collections.reduce((sum, c) => {
            if (!c.collection_date) return sum;
            const [cYear, cMonth] = c.collection_date.split("-").map(Number);
            if (cYear === currentYear && cMonth - 1 === currentMonth) {
                return sum + (c.amount_paid || 0);
            }
            return sum;
        }, 0);

        const monthlyOut = payouts.reduce((sum, p) => {
            if (!p.paid_date) return sum;
            const paidDate = new Date(p.paid_date);
            if (paidDate.getFullYear() === currentYear && paidDate.getMonth() === currentMonth) {
                return sum + (p.amount || 0);
            }
            return sum;
        }, 0);

        const netFlow = monthlyIn - monthlyOut;
        const totalCount = allTransactions.length;

        return (
            <StatsCarousel className="mb-8">
                <StatsCard
                    icon={ArrowDownLeft}
                    label="Monthly Inflow"
                    value={<FormattedCurrency amount={monthlyIn} />}
                    subtext="This month"
                    color="accent"
                />
                <StatsCard
                    icon={ArrowUpRight}
                    label="Monthly Outflow"
                    value={<FormattedCurrency amount={monthlyOut} />}
                    subtext="This month"
                    color="accent"
                />
                <StatsCard
                    icon={TrendingUp}
                    label="Net Cash Flow"
                    value={<FormattedCurrency amount={Math.abs(netFlow)} />}
                    subtext={netFlow >= 0 ? "Surplus" : "Deficit"}
                    color="accent"
                />
                <StatsCard
                    icon={BookOpen}
                    label="Total Records"
                    value={totalCount}
                    subtext="All time"
                    color="accent"
                />
            </StatsCarousel>
        );
    }, [collections, payouts, allTransactions, loading]);


    // --- FILTERING & SORTING ---
    const processedData = useMemo(() => {
        let data = [...allTransactions];

        // 1. Search
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            data = data.filter(item =>
                item.displayName?.toLowerCase().includes(lowerQuery) ||
                item.chitName?.toLowerCase().includes(lowerQuery) ||
                item.transactionAmount?.toString().includes(lowerQuery) ||
                (item.notes && item.notes.toLowerCase().includes(lowerQuery))
            );
        }

        // 2. Filter Type
        if (typeFilter) {
            data = data.filter(item => item.transactionType === typeFilter);
        }

        // 3. Sort
        data.sort((a, b) => {
            const dateA = new Date(a.transactionDate);
            const dateB = new Date(b.transactionDate);
            const amountA = a.transactionAmount || 0;
            const amountB = b.transactionAmount || 0;
            const nameA = a.displayName || "";
            const nameB = b.displayName || "";

            switch (sortBy) {
                case "date_asc": return dateA - dateB;
                case "date_desc": return dateB - dateA;
                case "amount_asc": return amountA - amountB;
                case "amount_desc": return amountB - amountA;
                case "member_asc": return nameA.localeCompare(nameB);
                case "member_desc": return nameB.localeCompare(nameA);
                default: return 0;
            }
        });

        return data;
    }, [allTransactions, searchQuery, typeFilter, sortBy]);

    // Pagination
    const totalPages = Math.ceil(processedData.length / ITEMS_PER_PAGE);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return processedData.slice(start, start + ITEMS_PER_PAGE);
    }, [processedData, currentPage]);


    // Keyboard Nav (optional)
    const { focusedRowIndex } = useTableKeyboardNavigation({
        tableRef,
        items: paginatedData,
        viewMode: "table",
        onNavigate: (item) => navigate(`/ledger/edit/${item.id}?type=${item.transactionType}`)
    });


    // Columns
    const columns = [
        {
            header: "Date",
            className: "text-center w-32",
            accessor: "transactionDate",
            cell: (row) => new Date(row.transactionDate).toLocaleDateString("en-IN", {
                day: "2-digit", month: "short", year: "numeric"
            })
        },
        {
            header: "Type",
            className: "text-center w-24",
            cell: (row) => (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${row.transactionType === "collection"
                    ? "bg-success-bg text-success-accent"
                    : "bg-error-bg text-error-accent"
                    }`}>
                    {row.transactionType === "collection" ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                    {row.transactionType === "collection" ? "In" : "Out"}
                </span>
            )
        },
        {
            header: "Member",
            accessor: "displayName",
            className: "text-left font-medium"
        },
        {
            header: "Chit",
            accessor: "chitName",
            className: "text-left text-text-secondary"
        },
        {
            header: "Amount",
            className: "text-right font-bold w-32",
            cell: (row) => (
                <span className={row.transactionType === "collection" ? "text-success-accent" : "text-error-accent"}>
                    {row.transactionType === "collection" ? "+" : "-"}
                    <FormattedCurrency amount={row.transactionAmount} />
                </span>
            )
        },
        {
            header: "Details", // Combined Method & Notes? Or just Method
            className: "text-center text-text-secondary text-sm hidden md:table-cell",
            cell: (row) => row.transactionType === 'collection' ? row.collection_method : row.transactionMethod
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
                            // Pass type in state or query param
                            navigate(`/ledger/edit/${row.id}`, { state: { type: row.transactionType } });
                        }}
                    />
                    <ActionButton
                        icon={Trash2}
                        variant="error"
                        title="Delete"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(row);
                        }}
                    />
                </div>
            )
        }
    ];

    return (
        <>
            <div className="w-full space-y-6">
                <PageHeader
                    title="Ledger"
                    actionIcon={Plus}
                    actionTitle="Log Transaction"
                    onAction={handleLogTransaction}
                />

                <hr className="border-border" />

                {success && <Message type="success">{success}</Message>}
                {error && <Message type="error" onClose={() => setLocalError(null)}>{error}</Message>}

                {metricsBlock}

                <SearchToolbar
                    searchValue={searchQuery}
                    onSearchChange={setSearchQuery}
                    searchPlaceholder="Search transactions..."

                    sortOptions={SORT_OPTIONS}
                    sortValue={sortBy}
                    onSortChange={setSortBy}

                    filterOptions={FILTER_OPTIONS}
                    filterValue={typeFilter}
                    onFilterChange={setTypeFilter}

                    hideViewToggle={true}
                />

                {loading ? (
                    <Skeleton.Table rows={10} />
                ) : processedData.length === 0 ? (
                    <EmptyState
                        icon={WalletMinimal}
                        title="No Transactions Found"
                        description="Try adjusting your filters or log a new transaction."
                    />
                ) : (
                    <>
                        <div ref={tableRef} className="overflow-x-auto rounded-lg shadow-sm">
                            <Table
                                columns={columns}
                                data={paginatedData}
                                onRowClick={(row) => navigate(`/ledger/edit/${row.id}`, { state: { type: row.transactionType } })}
                            />
                        </div>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </>
                )}

                <ConfirmationModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={handleConfirmDelete}
                    title="Delete Transaction"
                    message={`Are you sure you want to delete this ${itemToDelete?.transactionType}? This action cannot be undone.`}
                    confirmLabel="Delete"
                    cancelLabel="Cancel"
                    variant="error"
                />
            </div>

            <Link to="/ledger/create" className="group">
                <Button variant="fab" className="group-hover:scale-110">
                    <Plus className="w-6 h-6" />
                </Button>
            </Link>
        </>
    );
};

export default LedgerPage;
