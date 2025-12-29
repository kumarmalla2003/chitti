// frontend/src/features/ledger/pages/LedgerPage.jsx

import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import useScrollToTop from "../../../hooks/useScrollToTop";
import useTableKeyboardNavigation from "../../../hooks/useTableKeyboardNavigation";
import { useLedger } from "../hooks/useLedger";
import { useChits } from "../../chits/hooks/useChits";
import { useMembers } from "../../members/hooks/useMembers";
import {
    useDeleteCollection,
} from "../../collections/hooks/useCollections";

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
import DateFilterDropdown from "../../../components/ui/DateFilterDropdown";
import DateRangeModal from "../../../components/ui/DateRangeModal";

import {
    Plus,
    SquarePen,
    Trash2,
    WalletMinimal,
    TrendingUp,
    ArrowDownLeft,
    ArrowUpRight,
    BookOpen,
    User,
    Layers,
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
    { value: "collection", label: "Collections" },
    { value: "payout", label: "Payouts" },
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

    // Filter states for member and chit
    const [memberFilter, setMemberFilter] = useState(null);
    const [chitFilter, setChitFilter] = useState(null);

    // Date filter state
    const [dateFilter, setDateFilter] = useState({ type: "all" });
    const [isDateRangeModalOpen, setIsDateRangeModalOpen] = useState(false);

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

    // Fetch members and chits for filter dropdowns
    const { data: membersData } = useMembers();
    const { data: chitsData } = useChits();
    const allMembers = membersData?.members ?? [];
    const allChits = chitsData?.chits ?? [];

    // All payments (collections and payouts) use the payments API now
    const deletePaymentMutation = useDeleteCollection();

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

        deletePaymentMutation.mutate(itemToDelete.id, {
            onSuccess: () => {
                const typeName = itemToDelete.transactionType === "collection" ? "Collection" : "Payout";
                setSuccess(`${typeName} deleted successfully.`);
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

        // Monthly stats calculation logic (using new Payment API fields)
        const monthlyIn = collections.reduce((sum, c) => {
            if (!c.date) return sum;
            const [cYear, cMonth] = c.date.split("-").map(Number);
            if (cYear === currentYear && cMonth - 1 === currentMonth) {
                return sum + (c.amount || 0);
            }
            return sum;
        }, 0);

        const monthlyOut = payouts.reduce((sum, p) => {
            if (!p.paid_date) return sum;
            const paidDate = new Date(p.paid_date);
            if (paidDate.getFullYear() === currentYear && paidDate.getMonth() === currentMonth) {
                return sum + (p.amount_paid || 0);
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


    // --- HELPER: Calculate date range from filter ---
    const getDateRange = (filter) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        switch (filter.type) {
            case "preset": {
                switch (filter.preset) {
                    case "today":
                        return { start: today, end: new Date(today.getTime() + 86400000 - 1) };
                    case "this_week": {
                        const dayOfWeek = today.getDay();
                        const startOfWeek = new Date(today);
                        startOfWeek.setDate(today.getDate() - dayOfWeek);
                        const endOfWeek = new Date(startOfWeek);
                        endOfWeek.setDate(startOfWeek.getDate() + 6);
                        endOfWeek.setHours(23, 59, 59, 999);
                        return { start: startOfWeek, end: endOfWeek };
                    }
                    case "this_month": {
                        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                        return { start: startOfMonth, end: endOfMonth };
                    }
                    case "last_30_days": {
                        const start = new Date(today);
                        start.setDate(today.getDate() - 30);
                        return { start, end: new Date(today.getTime() + 86400000 - 1) };
                    }
                    case "this_year": {
                        const startOfYear = new Date(now.getFullYear(), 0, 1);
                        const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
                        return { start: startOfYear, end: endOfYear };
                    }
                    default:
                        return null;
                }
            }
            case "month": {
                const startOfMonth = new Date(filter.year, filter.month, 1);
                const endOfMonth = new Date(filter.year, filter.month + 1, 0, 23, 59, 59, 999);
                return { start: startOfMonth, end: endOfMonth };
            }
            case "custom": {
                if (filter.startDate && filter.endDate) {
                    const start = new Date(filter.startDate);
                    const end = new Date(filter.endDate);
                    end.setHours(23, 59, 59, 999);
                    return { start, end };
                }
                return null;
            }
            default:
                return null;
        }
    };

    // --- FILTERING & SORTING ---
    const processedData = useMemo(() => {
        let data = [...allTransactions];

        // 1. Member Filter
        if (memberFilter) {
            data = data.filter(item => String(item.member_id) === memberFilter);
        }

        // 2. Chit Filter
        if (chitFilter) {
            data = data.filter(item => String(item.chit_id) === chitFilter);
        }

        // 3. Search
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            data = data.filter(item =>
                item.displayName?.toLowerCase().includes(lowerQuery) ||
                item.chitName?.toLowerCase().includes(lowerQuery) ||
                item.transactionAmount?.toString().includes(lowerQuery) ||
                (item.notes && item.notes.toLowerCase().includes(lowerQuery))
            );
        }

        // 4. Filter Type
        if (typeFilter) {
            data = data.filter(item => item.transactionType === typeFilter);
        }

        // 5. Date Filter
        const dateRange = getDateRange(dateFilter);
        if (dateRange) {
            data = data.filter(item => {
                const itemDate = new Date(item.transactionDate);
                return itemDate >= dateRange.start && itemDate <= dateRange.end;
            });
        }

        // 5. Sort
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
    }, [allTransactions, memberFilter, chitFilter, searchQuery, typeFilter, dateFilter, sortBy]);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [memberFilter, chitFilter, searchQuery, typeFilter, dateFilter]);

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
            header: "S.No",
            className: "text-center w-16",
            cell: (_, index) => (currentPage - 1) * ITEMS_PER_PAGE + index + 1,
        },
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
            className: "text-center font-medium min-w-[200px]"
        },
        {
            header: "Chit",
            accessor: "chitName",
            className: "text-center text-text-secondary min-w-[150px]"
        },
        {
            header: "Amount",
            className: "text-center font-bold font-mono w-32",
            cell: (row) => (
                <span className={row.transactionType === "collection" ? "text-success-accent" : "text-error-accent"}>
                    {row.transactionType === "collection" ? "+" : "-"}
                    <FormattedCurrency amount={row.transactionAmount} />
                </span>
            )
        },
        {
            header: "Method",
            className: "text-center w-24 text-text-secondary text-sm hidden md:table-cell capitalize",
            cell: (row) => row.transactionMethod?.replace("_", " ") || "Cash"
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

                    customFilterElement={
                        <DateFilterDropdown
                            value={dateFilter}
                            onChange={setDateFilter}
                            onCustomRangeClick={() => setIsDateRangeModalOpen(true)}
                        />
                    }

                    dropdownFilters={[
                        {
                            id: "chit",
                            value: chitFilter,
                            onChange: setChitFilter,
                            placeholder: "All Chits",
                            icon: Layers,
                            options: allChits.map(c => ({ value: String(c.id), label: c.name })),
                        },
                        {
                            id: "member",
                            value: memberFilter,
                            onChange: setMemberFilter,
                            placeholder: "All Members",
                            icon: User,
                            options: allMembers.map(m => ({ value: String(m.id), label: m.full_name })),
                        },
                    ]}
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

                <DateRangeModal
                    isOpen={isDateRangeModalOpen}
                    onClose={() => setIsDateRangeModalOpen(false)}
                    onApply={({ startDate, endDate }) => {
                        setDateFilter({ type: "custom", startDate, endDate });
                    }}
                    initialStartDate={dateFilter.type === "custom" ? dateFilter.startDate : ""}
                    initialEndDate={dateFilter.type === "custom" ? dateFilter.endDate : ""}
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
