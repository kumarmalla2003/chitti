// frontend/src/features/ledger/pages/LedgerPage.jsx

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
import { getAllCollections } from "../../../services/collectionsService";
import { getAllPayouts } from "../../../services/payoutsService";

import Message from "../../../components/ui/Message";
import Button from "../../../components/ui/Button";
import Table from "../../../components/ui/Table";
import StatusBadge from "../../../components/ui/StatusBadge";
import Skeleton from "../../../components/ui/Skeleton";
import StaggerContainer from "../../../components/ui/StaggerContainer";
import StaggerItem from "../../../components/ui/StaggerItem";
import EmptyState from "../../../components/ui/EmptyState";
import PageHeader from "../../../components/ui/PageHeader";
import SearchToolbar from "../../../components/ui/SearchToolbar";
import ActionButton from "../../../components/ui/ActionButton";
import Pagination from "../../../components/ui/Pagination";
import TabButton from "../../../components/ui/TabButton";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";
import StatsCard from "../../../components/ui/StatsCard";
import StatsCarousel from "../../../components/ui/StatsCarousel";
import FormattedCurrency from "../../../components/ui/FormattedCurrency";

import CollectionCard from "../../collections/components/cards/CollectionCard";
import CollectionCardSkeleton from "../../collections/components/cards/CollectionCardSkeleton";
import PayoutCard from "../../payouts/components/cards/PayoutCard";
import PayoutCardSkeleton from "../../payouts/components/cards/PayoutCardSkeleton";
import CollectionReportModal from "../../collections/components/reports/CollectionReportModal";
import CollectionReportPDF from "../../collections/components/reports/CollectionReportPDF";
import PayoutReportModal from "../../payouts/components/reports/PayoutReportModal";
import PayoutReportPDF from "../../payouts/components/reports/PayoutReportPDF";

import { pdf } from "@react-pdf/renderer";
import {
    Plus,
    SquarePen,
    Trash2,
    Printer,
    WalletMinimal,
    TrendingUp,
    AlertCircle,
    Clock,
    CheckCircle2,
    ArrowDownLeft,
    ArrowUpRight,
    BookOpen,
    ChevronDown,
} from "lucide-react";

const ITEMS_PER_PAGE = 10;
const VIEW_MODE_STORAGE_KEY = "ledgerViewMode";
const ACTIVE_TAB_STORAGE_KEY = "ledgerActiveTab";

const TABS = ["collections", "payouts", "all"];

const COLLECTION_STATUS_OPTIONS = [
    { value: "Paid", label: "Paid" },
    { value: "Unpaid", label: "Unpaid" },
    { value: "Partial", label: "Partial" },
];

const PAYOUT_STATUS_OPTIONS = [
    { value: "Paid", label: "Paid" },
    { value: "Pending", label: "Pending" },
];

const ALL_STATUS_OPTIONS = [
    { value: "collection", label: "Collections" },
    { value: "payout", label: "Payouts" },
];

const SORT_OPTIONS = [
    { value: "date_desc", label: "Date (Newest)" },
    { value: "date_asc", label: "Date (Oldest)" },
    { value: "amount_desc", label: "Amount (High-Low)" },
    { value: "amount_asc", label: "Amount (Low-High)" },
    { value: "member_asc", label: "Member (A-Z)" },
    { value: "member_desc", label: "Member (Z-A)" },
];

const LedgerPage = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const tableRef = useRef(null);

    // Tab state from URL or localStorage
    const initialTab = searchParams.get("tab") || localStorage.getItem(ACTIVE_TAB_STORAGE_KEY) || "collections";
    const [activeTab, setActiveTab] = useState(TABS.includes(initialTab) ? initialTab : "collections");

    const [success, setSuccess] = useState(null);
    const [localError, setLocalError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState(null);
    const [sortBy, setSortBy] = useState("date_desc");
    const [currentPage, setCurrentPage] = useState(1);

    // View mode from localStorage
    const [viewMode, setViewMode] = useState(() => {
        const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
        if (stored === "table" || stored === "card") return stored;
        return window.innerWidth < 768 ? "card" : "table";
    });

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [deleteType, setDeleteType] = useState(null); // 'collection' or 'payout'
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportLoading, setReportLoading] = useState(false);

    // FAB dropdown state
    const [isFabOpen, setIsFabOpen] = useState(false);
    const fabRef = useRef(null);

    // Data hooks
    const {
        collections,
        payouts,
        allTransactions,
        chits,
        isLoading: loading,
        error: queryError,
    } = useLedger();

    const deleteCollectionMutation = useDeleteCollection();
    const deletePayoutMutation = useDeletePayout();

    const error = localError || (queryError?.message ?? null);

    useScrollToTop(success || error);

    // Persist tab to URL and localStorage
    useEffect(() => {
        setSearchParams({ tab: activeTab }, { replace: true });
        localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, activeTab);
    }, [activeTab, setSearchParams]);

    // Persist view mode
    useEffect(() => {
        localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
    }, [viewMode]);

    // Clear success message
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    // Reset page on filter/search/tab change
    useEffect(() => {
        setCurrentPage(1);
        setSearchQuery("");
        setStatusFilter(null);
    }, [activeTab]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter, sortBy]);

    // Close FAB dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (fabRef.current && !fabRef.current.contains(e.target)) {
                setIsFabOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Handle tab change
    const handleTabChange = useCallback((tab) => {
        setActiveTab(tab);
    }, []);

    // Delete handlers
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
                setSuccess(`${deleteType === "collection" ? "Collection" : "Payout"} record has been deleted.`);
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

    // Report generation (based on active tab)
    const handleGenerateReport = async (filters) => {
        setReportLoading(true);
        setLocalError(null);
        try {
            let reportData, ReportPDF, filename;

            if (activeTab === "collections") {
                const data = await getAllCollections(filters);
                reportData = data.collections || [];
                ReportPDF = CollectionReportPDF;
                filename = "Collection_Report.pdf";
                if (filters.chitName) filename = `${filters.chitName} Collections Report.pdf`;
                else if (filters.memberName) filename = `${filters.memberName} Collections Report.pdf`;
            } else {
                const data = await getAllPayouts(filters);
                reportData = Array.isArray(data) ? data : data.payouts || [];
                ReportPDF = PayoutReportPDF;
                filename = "Payout_Report.pdf";
                if (filters.chitName) filename = `${filters.chitName} Payouts Report.pdf`;
                else if (filters.memberName) filename = `${filters.memberName} Payouts Report.pdf`;
            }

            if (!reportData || reportData.length === 0) {
                setLocalError("No records found for the selected criteria.");
                setReportLoading(false);
                return;
            }

            const pdfProps = activeTab === "collections"
                ? { collections: reportData, filters }
                : { payouts: reportData, filters };

            const blob = await pdf(<ReportPDF {...pdfProps} />).toBlob();

            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setIsReportModalOpen(false);
        } catch (err) {
            console.error("Report generation failed", err);
            setLocalError(err.message || "Failed to generate report.");
        } finally {
            setReportLoading(false);
        }
    };

    // Format date helper
    const formatDate = (dateString) =>
        new Date(dateString).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });

    // --- DATA PROCESSING ---
    // Get data based on active tab
    const currentData = useMemo(() => {
        if (activeTab === "collections") return collections;
        if (activeTab === "payouts") return payouts;
        return allTransactions;
    }, [activeTab, collections, payouts, allTransactions]);

    // Search filter
    const searchedData = useMemo(() => {
        if (!searchQuery) return currentData;
        const lowercasedQuery = searchQuery.toLowerCase();
        return currentData.filter((item) => {
            if (activeTab === "collections") {
                return (
                    item.member?.full_name?.toLowerCase().includes(lowercasedQuery) ||
                    item.chit?.name?.toLowerCase().includes(lowercasedQuery) ||
                    item.amount_paid?.toString().includes(lowercasedQuery)
                );
            } else if (activeTab === "payouts") {
                return (
                    item.member?.full_name?.toLowerCase().includes(lowercasedQuery) ||
                    item.chit?.name?.toLowerCase().includes(lowercasedQuery) ||
                    (item.amount || 0).toString().includes(lowercasedQuery)
                );
            } else {
                return (
                    item.displayName?.toLowerCase().includes(lowercasedQuery) ||
                    item.chitName?.toLowerCase().includes(lowercasedQuery) ||
                    item.transactionAmount?.toString().includes(lowercasedQuery)
                );
            }
        });
    }, [currentData, searchQuery, activeTab]);

    // Status filter
    const filteredData = useMemo(() => {
        if (!statusFilter) return searchedData;
        if (activeTab === "collections") {
            return searchedData.filter((c) => c.collection_status === statusFilter);
        } else if (activeTab === "payouts") {
            return searchedData.filter((p) => p.status === statusFilter);
        } else {
            return searchedData.filter((t) => t.transactionType === statusFilter);
        }
    }, [searchedData, statusFilter, activeTab]);

    // Sort
    const sortedData = useMemo(() => {
        const sorted = [...filteredData];
        const getDate = (item) => {
            if (activeTab === "collections") return new Date(item.collection_date);
            if (activeTab === "payouts") return new Date(item.paid_date || 0);
            return new Date(item.transactionDate);
        };
        const getAmount = (item) => {
            if (activeTab === "collections") return item.amount_paid || 0;
            if (activeTab === "payouts") return item.amount || 0;
            return item.transactionAmount || 0;
        };
        const getMember = (item) => {
            if (activeTab === "all") return item.displayName || "";
            return item.member?.full_name || "";
        };

        switch (sortBy) {
            case "date_asc":
                return sorted.sort((a, b) => getDate(a) - getDate(b));
            case "date_desc":
                return sorted.sort((a, b) => getDate(b) - getDate(a));
            case "amount_asc":
                return sorted.sort((a, b) => getAmount(a) - getAmount(b));
            case "amount_desc":
                return sorted.sort((a, b) => getAmount(b) - getAmount(a));
            case "member_asc":
                return sorted.sort((a, b) => getMember(a).localeCompare(getMember(b)));
            case "member_desc":
                return sorted.sort((a, b) => getMember(b).localeCompare(getMember(a)));
            default:
                return sorted;
        }
    }, [filteredData, sortBy, activeTab]);

    // Pagination
    const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return sortedData.slice(start, start + ITEMS_PER_PAGE);
    }, [sortedData, currentPage]);

    // Keyboard navigation
    const { focusedRowIndex, resetFocus } = useTableKeyboardNavigation({
        tableRef,
        items: paginatedData,
        viewMode,
        onNavigate: (item) => {
            if (activeTab === "collections" || item.transactionType === "collection") {
                navigate(`/collections/view/${item.id}`);
            } else {
                navigate(`/payouts/view/${item.id}`);
            }
        },
    });

    // --- METRICS BLOCK ---
    const metricsBlock = useMemo(() => {
        if (loading) return null;

        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();

        // Monthly collections total
        const monthlyIn = collections.reduce((sum, c) => {
            if (!c.collection_date) return sum;
            const [cYear, cMonth] = c.collection_date.split("-").map(Number);
            if (cYear === currentYear && cMonth - 1 === currentMonth) {
                return sum + (c.amount_paid || 0);
            }
            return sum;
        }, 0);

        // Monthly payouts total (only paid ones)
        const monthlyOut = payouts.reduce((sum, p) => {
            if (!p.paid_date) return sum;
            const paidDate = new Date(p.paid_date);
            if (paidDate.getFullYear() === currentYear && paidDate.getMonth() === currentMonth) {
                return sum + (p.amount || 0);
            }
            return sum;
        }, 0);

        // Net cash flow
        const netFlow = monthlyIn - monthlyOut;

        // Transaction count this month
        const collectionsCount = collections.filter((c) => {
            if (!c.collection_date) return false;
            const [cYear, cMonth] = c.collection_date.split("-").map(Number);
            return cYear === currentYear && cMonth - 1 === currentMonth;
        }).length;

        const payoutsCount = payouts.filter((p) => {
            if (!p.paid_date) return false;
            const paidDate = new Date(p.paid_date);
            return paidDate.getFullYear() === currentYear && paidDate.getMonth() === currentMonth;
        }).length;

        return (
            <StatsCarousel className="mb-8">
                <StatsCard
                    icon={ArrowDownLeft}
                    label="Monthly Inflow"
                    value={<FormattedCurrency amount={monthlyIn} />}
                    subtext={`${collectionsCount} collections`}
                    color="accent"
                />
                <StatsCard
                    icon={ArrowUpRight}
                    label="Monthly Outflow"
                    value={<FormattedCurrency amount={monthlyOut} />}
                    subtext={`${payoutsCount} payouts`}
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
                    label="Total Transactions"
                    value={collectionsCount + payoutsCount}
                    subtext="This month"
                    color="accent"
                />
            </StatsCarousel>
        );
    }, [collections, payouts, loading]);

    // Get status options based on tab
    const statusOptions = useMemo(() => {
        if (activeTab === "collections") return COLLECTION_STATUS_OPTIONS;
        if (activeTab === "payouts") return PAYOUT_STATUS_OPTIONS;
        return ALL_STATUS_OPTIONS;
    }, [activeTab]);

    // --- TABLE COLUMNS ---
    const collectionsColumns = [
        {
            header: "S.No",
            className: "text-center",
            cell: (_, index) => (currentPage - 1) * ITEMS_PER_PAGE + index + 1,
        },
        {
            header: "Date",
            accessor: "collection_date",
            cell: (row) => formatDate(row.collection_date),
            className: "text-center",
        },
        {
            header: "Member",
            accessor: "member.full_name",
            className: "text-center",
        },
        {
            header: "Chit",
            accessor: "chit.name",
            className: "text-center",
        },
        {
            header: "Amount",
            accessor: "amount_paid",
            className: "text-center",
            cell: (row) => `₹${row.amount_paid.toLocaleString("en-IN")}`,
        },
        {
            header: "Status",
            accessor: "collection_status",
            className: "text-center",
            cell: (row) => <StatusBadge status={row.collection_status || "Unpaid"} />,
        },
        {
            header: "Actions",
            className: "text-center",
            cell: (row) => (
                <div className="flex items-center justify-center space-x-2">
                    <ActionButton
                        icon={SquarePen}
                        variant="warning"
                        title="Edit"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/collections/edit/${row.id}`);
                        }}
                    />
                    <ActionButton
                        icon={Trash2}
                        variant="error"
                        title="Delete"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(row, "collection");
                        }}
                    />
                </div>
            ),
        },
    ];

    const payoutsColumns = [
        {
            header: "S.No",
            className: "text-center",
            cell: (_, index) => (currentPage - 1) * ITEMS_PER_PAGE + index + 1,
        },
        {
            header: "Month",
            accessor: "month",
            className: "text-center",
        },
        {
            header: "Member",
            accessor: "member.full_name",
            className: "text-center",
            cell: (row) => row.member?.full_name || "-",
        },
        {
            header: "Chit",
            accessor: "chit.name",
            className: "text-center",
            cell: (row) => row.chit?.name || "-",
        },
        {
            header: "Amount",
            accessor: "amount",
            className: "text-center",
            cell: (row) => row.amount ? `₹${row.amount.toLocaleString("en-IN")}` : "-",
        },
        {
            header: "Status",
            accessor: "status",
            className: "text-center",
            cell: (row) => <StatusBadge status={row.status || "Pending"} />,
        },
        {
            header: "Actions",
            className: "text-center",
            cell: (row) => (
                <div className="flex items-center justify-center space-x-2">
                    <ActionButton
                        icon={SquarePen}
                        variant="warning"
                        title="Edit"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/payouts/edit/${row.id}`);
                        }}
                    />
                    <ActionButton
                        icon={Trash2}
                        variant="error"
                        title="Delete"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(row, "payout");
                        }}
                    />
                </div>
            ),
        },
    ];

    const allColumns = [
        {
            header: "S.No",
            className: "text-center",
            cell: (_, index) => (currentPage - 1) * ITEMS_PER_PAGE + index + 1,
        },
        {
            header: "Date",
            className: "text-center",
            cell: (row) => formatDate(row.transactionDate),
        },
        {
            header: "Type",
            className: "text-center",
            cell: (row) => (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${row.transactionType === "collection"
                        ? "bg-success-bg text-success-accent"
                        : "bg-error-bg text-error-accent"
                    }`}>
                    {row.transactionType === "collection" ? (
                        <><ArrowDownLeft className="w-3 h-3" /> In</>
                    ) : (
                        <><ArrowUpRight className="w-3 h-3" /> Out</>
                    )}
                </span>
            ),
        },
        {
            header: "Member",
            className: "text-center",
            cell: (row) => row.displayName,
        },
        {
            header: "Chit",
            className: "text-center",
            cell: (row) => row.chitName,
        },
        {
            header: "Amount",
            className: "text-center",
            cell: (row) => (
                <span className={row.transactionType === "collection" ? "text-success-accent" : "text-error-accent"}>
                    {row.transactionType === "collection" ? "+" : "-"}₹{row.transactionAmount?.toLocaleString("en-IN") || 0}
                </span>
            ),
        },
    ];

    const columns = activeTab === "collections" ? collectionsColumns : activeTab === "payouts" ? payoutsColumns : allColumns;

    // --- RENDER ---
    return (
        <>
            <div className="w-full space-y-8">
                {/* Page Header */}
                {loading ? (
                    <Skeleton.PageHeader showAction={activeTab !== "all"} />
                ) : (
                    <PageHeader
                        title="Ledger"
                        actionIcon={Printer}
                        actionTitle="Generate Report"
                        onAction={() => setIsReportModalOpen(true)}
                        showAction={currentData.length > 0 && activeTab !== "all"}
                    />
                )}

                <hr className="border-border" />

                {/* Tab Navigation */}
                <div className="flex items-center border-b border-border overflow-x-auto whitespace-nowrap no-scrollbar">
                    <TabButton
                        name="collections"
                        icon={ArrowDownLeft}
                        label="Collections"
                        activeTab={activeTab}
                        setActiveTab={handleTabChange}
                    />
                    <TabButton
                        name="payouts"
                        icon={ArrowUpRight}
                        label="Payouts"
                        activeTab={activeTab}
                        setActiveTab={handleTabChange}
                    />
                    <TabButton
                        name="all"
                        icon={BookOpen}
                        label="All"
                        activeTab={activeTab}
                        setActiveTab={handleTabChange}
                    />
                </div>

                {success && <Message type="success">{success}</Message>}
                {error && (
                    <Message type="error" onClose={() => setLocalError(null)}>
                        {error}
                    </Message>
                )}

                {/* Loading State */}
                {loading && (
                    <>
                        <StatsCarousel isLoading className="mb-8" />
                        <Skeleton.SearchToolbar />
                        {viewMode === "table" ? (
                            <Skeleton.Table rows={ITEMS_PER_PAGE} />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
                                    activeTab === "payouts" ? <PayoutCardSkeleton key={i} /> : <CollectionCardSkeleton key={i} />
                                ))}
                            </div>
                        )}
                        <Skeleton.Pagination />
                    </>
                )}

                {/* Loaded State */}
                {!loading && currentData.length > 0 && metricsBlock}

                {/* Search Toolbar */}
                {!loading && currentData.length >= 2 && (
                    <SearchToolbar
                        searchPlaceholder={
                            activeTab === "collections"
                                ? "Search by member, chit, or amount..."
                                : activeTab === "payouts"
                                    ? "Search payouts..."
                                    : "Search all transactions..."
                        }
                        searchValue={searchQuery}
                        onSearchChange={setSearchQuery}
                        sortOptions={SORT_OPTIONS}
                        sortValue={sortBy}
                        onSortChange={setSortBy}
                        filterOptions={statusOptions}
                        filterValue={statusFilter}
                        onFilterChange={setStatusFilter}
                        viewMode={viewMode}
                        onViewChange={setViewMode}
                        hideViewToggle={activeTab === "all"}
                    />
                )}

                {/* Empty State */}
                {!loading && sortedData.length === 0 && (
                    <EmptyState
                        icon={activeTab === "collections" ? WalletMinimal : activeTab === "payouts" ? TrendingUp : BookOpen}
                        title={
                            searchQuery || statusFilter
                                ? "No Matching Records"
                                : `No ${activeTab === "collections" ? "Collections" : activeTab === "payouts" ? "Payouts" : "Transactions"} Found`
                        }
                        description={
                            searchQuery || statusFilter
                                ? "Try adjusting your search or filter."
                                : activeTab === "all"
                                    ? "Start logging collections or payouts to see them here."
                                    : `Click the + button to add your first ${activeTab === "collections" ? "collection" : "payout"}.`
                        }
                    />
                )}

                {/* Data Table/Cards */}
                {!loading && sortedData.length > 0 && (
                    <>
                        {viewMode === "table" || activeTab === "all" ? (
                            <div
                                ref={tableRef}
                                tabIndex={0}
                                className="overflow-x-auto rounded-lg shadow-sm focus:outline-none"
                            >
                                <Table
                                    columns={columns}
                                    data={paginatedData}
                                    onRowClick={(row) => {
                                        if (activeTab === "collections") {
                                            navigate(`/collections/view/${row.id}`);
                                        } else if (activeTab === "payouts") {
                                            navigate(`/payouts/view/${row.id}`);
                                        } else {
                                            navigate(row.transactionType === "collection" ? `/collections/view/${row.id}` : `/payouts/view/${row.id}`);
                                        }
                                    }}
                                    focusedRowIndex={focusedRowIndex}
                                />
                            </div>
                        ) : (
                            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {paginatedData.map((item) => (
                                    <StaggerItem key={item.id}>
                                        {activeTab === "collections" ? (
                                            <CollectionCard
                                                collection={item}
                                                onEdit={() => navigate(`/collections/edit/${item.id}`)}
                                                onDelete={() => handleDeleteClick(item, "collection")}
                                            />
                                        ) : (
                                            <PayoutCard
                                                payout={item}
                                                onEdit={() => navigate(`/payouts/edit/${item.id}`)}
                                                onDelete={() => handleDeleteClick(item, "payout")}
                                            />
                                        )}
                                    </StaggerItem>
                                ))}
                            </StaggerContainer>
                        )}

                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </>
                )}
            </div>

            {/* FAB with Dropdown */}
            {activeTab !== "all" && (
                <div ref={fabRef} className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-50">
                    {isFabOpen && (
                        <div className="absolute bottom-16 right-0 mb-2 bg-background-secondary border border-border rounded-lg shadow-xl overflow-hidden animate-fade-in">
                            <button
                                onClick={() => {
                                    navigate("/collections/create");
                                    setIsFabOpen(false);
                                }}
                                className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-background-tertiary transition-colors"
                            >
                                <ArrowDownLeft className="w-5 h-5 text-success-accent" />
                                <span className="text-sm font-medium text-text-primary">Log Collection</span>
                            </button>
                            <hr className="border-border" />
                            <button
                                onClick={() => {
                                    navigate("/payouts/create");
                                    setIsFabOpen(false);
                                }}
                                className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-background-tertiary transition-colors"
                            >
                                <ArrowUpRight className="w-5 h-5 text-error-accent" />
                                <span className="text-sm font-medium text-text-primary">Record Payout</span>
                            </button>
                        </div>
                    )}
                    <Button
                        variant="fab"
                        onClick={() => setIsFabOpen(!isFabOpen)}
                        className={`transition-transform duration-200 ${isFabOpen ? "rotate-45" : ""}`}
                    >
                        <Plus className="w-6 h-6" />
                    </Button>
                </div>
            )}

            {/* Report Modals */}
            {activeTab === "collections" && (
                <CollectionReportModal
                    isOpen={isReportModalOpen}
                    onClose={() => setIsReportModalOpen(false)}
                    onGenerate={handleGenerateReport}
                    loading={reportLoading}
                />
            )}
            {activeTab === "payouts" && (
                <PayoutReportModal
                    isOpen={isReportModalOpen}
                    onClose={() => setIsReportModalOpen(false)}
                    onGenerate={handleGenerateReport}
                    loading={reportLoading}
                />
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title={`Delete ${deleteType === "collection" ? "Collection" : "Payout"}?`}
                message="Are you sure you want to permanently delete this record? This action cannot be undone."
                loading={deleteCollectionMutation.isPending || deletePayoutMutation.isPending}
            />
        </>
    );
};

export default LedgerPage;
