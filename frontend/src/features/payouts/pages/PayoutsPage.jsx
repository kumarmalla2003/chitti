// frontend/src/features/payouts/pages/PayoutsPage.jsx

import { useState, useEffect, useMemo, useRef } from "react";
import useScrollToTop from "../../../hooks/useScrollToTop";
import useTableKeyboardNavigation from "../../../hooks/useTableKeyboardNavigation";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { usePayouts, useDeletePayout } from "../hooks/usePayouts";
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
import PayoutCard from "../components/cards/PayoutCard";
import PayoutCardSkeleton from "../components/cards/PayoutCardSkeleton";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";
import {
  Plus,
  SquarePen,
  Trash2,
  Printer,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle2,
  WalletMinimal,
} from "lucide-react";

import StatsCard from "../../../components/ui/StatsCard";
import StatsCarousel from "../../../components/ui/StatsCarousel";
import FormattedCurrency from "../../../components/ui/FormattedCurrency";
import { useCollections } from "../../collections/hooks/useCollections";
import { useChits } from "../../chits/hooks/useChits";

import { pdf } from "@react-pdf/renderer";
import PayoutReportPDF from "../components/reports/PayoutReportPDF";
import PayoutReportModal from "../components/reports/PayoutReportModal";

const ITEMS_PER_PAGE = 10;
const VIEW_MODE_STORAGE_KEY = "payoutsViewMode";

const STATUS_OPTIONS = [
  { value: "Paid", label: "Paid" },
  { value: "Pending", label: "Pending" },
];

const SORT_OPTIONS = [
  { value: "date_desc", label: "Date (Newest)" },
  { value: "date_asc", label: "Date (Oldest)" },
  { value: "amount_desc", label: "Amount (High-Low)" },
  { value: "amount_asc", label: "Amount (Low-High)" },
  { value: "member_asc", label: "Member (A-Z)" },
  { value: "member_desc", label: "Member (Z-A)" },
];

const PayoutsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const tableRef = useRef(null);

  const [success, setSuccess] = useState(null);
  const [localError, setLocalError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [sortBy, setSortBy] = useState("date_desc");
  const [currentPage, setCurrentPage] = useState(1);

  // Initialize view mode from localStorage, fallback to responsive default
  const [viewMode, setViewMode] = useState(() => {
    const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    if (stored === "table" || stored === "card") {
      return stored;
    }
    return window.innerWidth < 768 ? "card" : "table";
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  // React Query hooks
  const {
    data: payoutsData,
    isLoading: loading,
    error: queryError,
  } = usePayouts();

  const deletePayoutMutation = useDeletePayout();

  // Additional data for stats
  const { data: collectionsData } = useCollections();
  const { data: chitsData } = useChits();

  // Extract payouts from query data
  const payouts = useMemo(() => {
    const rawPayouts = payoutsData?.payouts ?? (Array.isArray(payoutsData) ? payoutsData : []);
    return rawPayouts;
  }, [payoutsData]);

  // Combine query error with local error
  const error = localError || (queryError?.message ?? null);

  useScrollToTop(success || error);

  // Persist view mode to localStorage
  useEffect(() => {
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (location.state?.success) {
      setSuccess(location.state.success);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Reset to page 1 when search/filter/sort changes
  useEffect(() => {
    setCurrentPage(1);
    resetFocus();
  }, [searchQuery, statusFilter, sortBy]);

  const handleDeleteClick = (payout) => {
    setItemToDelete(payout);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setLocalError(null);

    deletePayoutMutation.mutate(itemToDelete.id, {
      onSuccess: () => {
        setSuccess(`Payout record has been deleted.`);
        setIsModalOpen(false);
        setItemToDelete(null);
      },
      onError: (err) => {
        setLocalError(err.message);
        setIsModalOpen(false);
        setItemToDelete(null);
      },
    });
  };

  const handleGenerateReport = async (filters) => {
    setReportLoading(true);
    setLocalError(null);
    try {
      const data = await getAllPayouts(filters);
      const reportPayouts = Array.isArray(data) ? data : data.payouts || [];

      if (!reportPayouts || reportPayouts.length === 0) {
        setLocalError("No payouts found for the selected criteria.");
        setReportLoading(false);
        return;
      }

      const blob = await pdf(
        <PayoutReportPDF payouts={reportPayouts} filters={filters} />
      ).toBlob();

      let filename = "Payout_Report.pdf";

      if (filters.chitName) {
        let name = filters.chitName;
        if (!name.toLowerCase().endsWith("chit")) {
          name += " Chit";
        }
        filename = `${filters.chitName} Payouts Report.pdf`;
      } else if (filters.memberName) {
        filename = `${filters.memberName} Payouts Report.pdf`;
      } else if (filters.startDate) {
        const formatDateForFilename = (dateStr) => {
          if (!dateStr) return "";
          const [y, m, d] = dateStr.split("-");
          return `${d}-${m}-${y}`;
        };
        const startStr = formatDateForFilename(filters.startDate);
        const endStr = formatDateForFilename(filters.endDate);
        filename = `${startStr} to ${endStr} Payouts Report.pdf`;
      }

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

  // Filter by search query
  const searchedPayouts = useMemo(() => {
    if (!searchQuery) return payouts;
    const lowercasedQuery = searchQuery.toLowerCase();
    return payouts.filter(
      (p) =>
        p.member?.full_name?.toLowerCase().includes(lowercasedQuery) ||
        p.chit?.name?.toLowerCase().includes(lowercasedQuery) ||
        (p.amount || 0).toString().includes(lowercasedQuery)
    );
  }, [payouts, searchQuery]);

  // Filter by status
  const filteredPayouts = useMemo(() => {
    if (!statusFilter) return searchedPayouts;
    return searchedPayouts.filter((p) => p.status === statusFilter);
  }, [searchedPayouts, statusFilter]);

  // Sort filtered payouts
  const sortedPayouts = useMemo(() => {
    const sorted = [...filteredPayouts];
    switch (sortBy) {
      case "date_asc":
        return sorted.sort((a, b) => new Date(a.paid_date) - new Date(b.paid_date));
      case "date_desc":
        return sorted.sort((a, b) => new Date(b.paid_date) - new Date(a.paid_date));
      case "amount_asc":
        return sorted.sort((a, b) => (a.amount || 0) - (b.amount || 0));
      case "amount_desc":
        return sorted.sort((a, b) => (b.amount || 0) - (a.amount || 0));
      case "member_asc":
        return sorted.sort((a, b) =>
          (a.member?.full_name || "").localeCompare(b.member?.full_name || "")
        );
      case "member_desc":
        return sorted.sort((a, b) =>
          (b.member?.full_name || "").localeCompare(a.member?.full_name || "")
        );
      default:
        return sorted;
    }
  }, [filteredPayouts, sortBy]);

  // Pagination
  const totalPages = Math.ceil(sortedPayouts.length / ITEMS_PER_PAGE);
  const paginatedPayouts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedPayouts.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedPayouts, currentPage]);

  // Keyboard navigation
  const { focusedRowIndex, resetFocus } = useTableKeyboardNavigation({
    tableRef,
    items: paginatedPayouts,
    viewMode,
    onNavigate: (payout) => navigate(`/payouts/view/${payout.id}`),
  });

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  // Metrics Block
  const metricsBlock = useMemo(() => {
    if (loading) return null;

    const collections = collectionsData?.collections || [];
    const chits = chitsData?.chits || [];
    const activeChits = chits.filter((c) => c.status === "Active");

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    // Metric 1: Priority Payout
    const priorityPayout = (() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const unpaidPayouts = payouts.filter((p) => p.status === "Pending");

      if (unpaidPayouts.length === 0) {
        const upcomingPayouts = payouts
          .filter((p) => new Date(p.paid_date) > today && p.status === "Paid")
          .sort((a, b) => new Date(a.paid_date) - new Date(b.paid_date));

        if (upcomingPayouts.length === 0) return null;

        const earliestDate = upcomingPayouts[0].paid_date;
        const sameDate = upcomingPayouts.filter((p) => p.paid_date === earliestDate);

        if (sameDate.length === 1) {
          return { ...sameDate[0], isUpcoming: true };
        } else {
          return {
            paid_date: earliestDate,
            amount: sameDate.reduce((sum, p) => sum + p.amount, 0),
            count: sameDate.length,
            isUpcoming: true,
            isAggregated: true,
          };
        }
      }

      const sortedUnpaid = unpaidPayouts.sort(
        (a, b) => new Date(a.paid_date) - new Date(b.paid_date)
      );

      const earliestDate = sortedUnpaid[0].paid_date;
      const sameDate = sortedUnpaid.filter((p) => p.paid_date === earliestDate);

      if (sameDate.length === 1) {
        return { ...sameDate[0], isUpcoming: false };
      } else {
        return {
          paid_date: earliestDate,
          amount: sameDate.reduce((sum, p) => sum + p.amount, 0),
          count: sameDate.length,
          isUpcoming: false,
          isAggregated: true,
        };
      }
    })();

    // Metric 2: Monthly Payouts - Optimized single pass using scheduled dates
    const payoutMetrics = payouts.reduce(
      (metrics, p) => {
        if (!p.chit || !p.chit.start_date) return metrics;
        
        const chitStartDate = new Date(p.chit.start_date);
        const scheduledDate = new Date(chitStartDate);
        scheduledDate.setMonth(chitStartDate.getMonth() + (p.month - 1));
        
        const isThisMonth =
          scheduledDate.getMonth() === currentMonth &&
          scheduledDate.getFullYear() === currentYear;
        
        if (!isThisMonth) return metrics;
        
        return {
          paidAmount: metrics.paidAmount + (p.paid_date ? (p.amount || 0) : 0),
          expectedAmount: metrics.expectedAmount + (p.planned_amount || 0),
          paidCount: metrics.paidCount + (p.paid_date ? 1 : 0),
          totalCount: metrics.totalCount + 1,
        };
      },
      { paidAmount: 0, expectedAmount: 0, paidCount: 0, totalCount: 0 }
    );

    const paidAmount = payoutMetrics.paidAmount;
    const expectedAmount = payoutMetrics.expectedAmount;
    const paidCount = payoutMetrics.paidCount;
    const totalScheduledCount = payoutMetrics.totalCount;

    // Metric 4: Monthly Collection
    const collectedThisMonth = collections.reduce((sum, c) => {
      if (!c.collection_date) return sum;
      const [cYear, cMonth] = c.collection_date.split("-").map(Number);
      if (cYear === currentYear && cMonth - 1 === currentMonth) {
        return sum + (c.amount_paid || 0);
      }
      return sum;
    }, 0);

    // Calculate monthly collection target (handle different chit types)
    const monthlyCollectionTarget = activeChits.reduce((sum, c) => {
      let chitTotal = 0;
      if (c.chit_type === "fixed" || !c.chit_type) {
        chitTotal = (c.base_contribution || 0) * (c.size || 0);
      } else if (c.chit_type === "variable") {
        // Calculate current cycle from chit start date
        const startDate = new Date(c.start_date);
        const today = new Date();
        const monthsDiff = (today.getFullYear() - startDate.getFullYear()) * 12 + 
                          (today.getMonth() - startDate.getMonth()) + 1;
        const currentCycle = Math.max(1, Math.min(monthsDiff, c.duration_months || 1));
        const totalCycle = c.duration_months || 1;
        
        // Formula: (total - current + 1) × before + (current - 1) × after
        const membersBefore = totalCycle - currentCycle + 1;
        const membersAfter = currentCycle - 1;
        chitTotal = membersBefore * (c.installment_before_payout || 0) + 
                   membersAfter * (c.installment_after_payout || 0);
      }
      return sum + chitTotal;
    }, 0);

    return (
      <StatsCarousel className="mb-8">
        {/* Card 1: Priority Payout */}
        <StatsCard
          icon={priorityPayout?.isUpcoming ? Clock : AlertCircle}
          label={priorityPayout?.isUpcoming ? "Next Payout" : "Priority Payout"}
          value={
            priorityPayout ? (
              <FormattedCurrency amount={priorityPayout.amount} />
            ) : (
              "No payouts"
            )
          }
          subtext={
            !priorityPayout
              ? "All clear"
              : priorityPayout.isAggregated
              ? `${priorityPayout.count} payouts on ${formatDate(priorityPayout.paid_date)}`
              : formatDate(priorityPayout.paid_date)
          }
          color="accent"
        />
        {/* Card 2: Monthly Payouts */}
        <StatsCard
          icon={TrendingUp}
          label="Monthly Payouts"
          value={<FormattedCurrency amount={paidAmount} />}
          subtext={
            <span className="inline-flex items-center gap-1">
              Target: <FormattedCurrency amount={expectedAmount} showIcon={true} />
            </span>
          }
          color="accent"
        />
        {/* Card 3: Payout Count */}
        <StatsCard
          icon={CheckCircle2}
          label="Payout Count"
          value={paidCount}
          subtext={`Total Scheduled: ${totalScheduledCount}`}
          color="accent"
        />
        {/* Card 4: Monthly Collection */}
        <StatsCard
          icon={WalletMinimal}
          label="Monthly Collection"
          value={<FormattedCurrency amount={collectedThisMonth} />}
          subtext={
            <span className="inline-flex items-center gap-1">
              Target: <FormattedCurrency amount={monthlyCollectionTarget} showIcon={true} />
            </span>
          }
          color="accent"
        />
      </StatsCarousel>
    );
  }, [payouts, collectionsData, chitsData, loading]);

  const columns = [
    {
      header: "S.No",
      accessor: "s_no",
      className: "text-center",
      cell: (row, index) => (currentPage - 1) * ITEMS_PER_PAGE + index + 1,
    },
    {
      header: "Date",
      accessor: "paid_date",
      cell: (row) => formatDate(row.paid_date),
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
      accessor: "amount",
      className: "text-center font-medium text-error-accent",
      cell: (row) => `₹${(row.amount || 0).toLocaleString("en-IN")}`,
    },
    {
      header: "Status",
      accessor: "status",
      className: "text-center",
      cell: (row) => <StatusBadge status={row.status || "Pending"} />,
    },
    {
      header: "Actions",
      accessor: "actions",
      className: "text-center",
      cell: (row) => (
        <div className="flex items-center justify-center space-x-2">
          <ActionButton
            icon={SquarePen}
            variant="warning"
            title="Edit Payout"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/payouts/edit/${row.id}`);
            }}
          />
          <ActionButton
            icon={Trash2}
            variant="error"
            title="Delete Payout"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(row);
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="w-full space-y-8">
        {/* Page Header - show skeleton when loading */}
        {loading ? (
          <Skeleton.PageHeader showAction={true} />
        ) : (
          <PageHeader
            title="All Payouts"
            actionIcon={Printer}
            actionTitle="Generate Report"
            onAction={() => setIsReportModalOpen(true)}
            showAction={payouts.length > 0}
          />
        )}

        <hr className="border-border" />

        {success && <Message type="success">{success}</Message>}
        {error && (
          <Message type="error" onClose={() => setLocalError(null)}>
            {error}
          </Message>
        )}

        {/* --- Loading State: Skeletons in correct visual order --- */}
        {loading && (
          <>
            {/* Metrics Skeleton */}
            <StatsCarousel isLoading className="mb-8" />

            {/* SearchToolbar Skeleton */}
            <Skeleton.SearchToolbar />

            {/* Table/Card Skeleton */}
            {viewMode === "table" ? (
              <Skeleton.Table
                rows={ITEMS_PER_PAGE}
                columnWidths={[
                  "w-16",   // S.No
                  "w-1/6",  // Date
                  "w-1/5",  // Member
                  "w-1/5",  // Chit
                  "w-1/6",  // Amount
                  "w-24",   // Status
                  "w-28",   // Actions (2 buttons)
                ]}
                serialColumnIndex={0}
                statusColumnIndex={5}
                actionColumnIndex={6}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
                  <PayoutCardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Pagination Skeleton */}
            <Skeleton.Pagination />
          </>
        )}

        {/* --- Loaded State: Actual content --- */}
        {/* Overview Metrics */}
        {!loading && payouts.length > 0 && metricsBlock}

        {/* Unified Search Toolbar - only show when 2+ items */}
        {!loading && payouts.length >= 2 && (
          <SearchToolbar
            searchPlaceholder="Search by member, chit, or amount..."
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            sortOptions={SORT_OPTIONS}
            sortValue={sortBy}
            onSortChange={setSortBy}
            filterOptions={STATUS_OPTIONS}
            filterValue={statusFilter}
            onFilterChange={setStatusFilter}
            viewMode={viewMode}
            onViewChange={setViewMode}
          />
        )}

        {!loading && sortedPayouts.length === 0 && (
          <EmptyState
            icon={TrendingUp}
            title={
              searchQuery || statusFilter
                ? "No Matching Payouts"
                : "No Payouts Found"
            }
            description={
              searchQuery || statusFilter
                ? "Try adjusting your search or filter."
                : "You haven't recorded any payouts yet. Click the + button to start!"
            }
          />
        )}

        {!loading && sortedPayouts.length > 0 && (
          <>
            {viewMode === "table" ? (
              <div
                ref={tableRef}
                tabIndex={0}
                className="overflow-x-auto rounded-lg shadow-sm focus:outline-none"
              >
                <Table
                  columns={columns}
                  data={paginatedPayouts}
                  onRowClick={(row) => navigate(`/payouts/view/${row.id}`)}
                  focusedRowIndex={focusedRowIndex}
                />
              </div>
            ) : (
              <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedPayouts.map((payout) => (
                  <StaggerItem key={payout.id}>
                    <PayoutCard
                      payout={payout}
                      onView={() => navigate(`/payouts/view/${payout.id}`)}
                      onEdit={() => navigate(`/payouts/edit/${payout.id}`)}
                      onDelete={() => handleDeleteClick(payout)}
                    />
                  </StaggerItem>
                ))}
              </StaggerContainer>
            )}

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>
      <Link to="/payouts/create" className="group">
        <Button variant="fab" className="group-hover:scale-110">
          <Plus className="w-6 h-6" />
        </Button>
      </Link>

      <PayoutReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onGenerate={handleGenerateReport}
        loading={reportLoading}
      />

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Payout?"
        message={`Are you sure you want to permanently delete this payout record? This action cannot be undone.`}
        loading={deletePayoutMutation.isPending}
      />
    </>
  );
};

export default PayoutsPage;
