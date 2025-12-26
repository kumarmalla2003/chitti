// frontend/src/features/collections/pages/CollectionsPage.jsx

import { useState, useEffect, useMemo, useRef } from "react";
import useScrollToTop from "../../../hooks/useScrollToTop";
import useTableKeyboardNavigation from "../../../hooks/useTableKeyboardNavigation";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  useCollections,
  useDeleteCollection,
} from "../hooks/useCollections";
import { getAllCollections } from "../../../services/collectionsService";
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
import CollectionCard from "../components/cards/CollectionCard";
import CollectionCardSkeleton from "../components/cards/CollectionCardSkeleton";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";
import {
  Plus,
  SquarePen,
  Trash2,
  Printer,
  WalletMinimal,
  AlertCircle,
  Clock,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

import StatsCard from "../../../components/ui/StatsCard";
import StatsCarousel from "../../../components/ui/StatsCarousel";
import FormattedCurrency from "../../../components/ui/FormattedCurrency";
import { usePayouts } from "../../payouts/hooks/usePayouts";
import { useChits } from "../../chits/hooks/useChits";

import CollectionReportPDF from "../components/reports/CollectionReportPDF";
import CollectionReportModal from "../components/reports/CollectionReportModal";
import { pdf } from "@react-pdf/renderer";

const ITEMS_PER_PAGE = 10;
const VIEW_MODE_STORAGE_KEY = "collectionsViewMode";

const STATUS_OPTIONS = [
  { value: "Paid", label: "Paid" },
  { value: "Unpaid", label: "Unpaid" },
  { value: "Partial", label: "Partial" },
];

const SORT_OPTIONS = [
  { value: "date_desc", label: "Date (Newest)" },
  { value: "date_asc", label: "Date (Oldest)" },
  { value: "amount_desc", label: "Amount (High-Low)" },
  { value: "amount_asc", label: "Amount (Low-High)" },
  { value: "member_asc", label: "Member (A-Z)" },
  { value: "member_desc", label: "Member (Z-A)" },
];

const CollectionsPage = () => {
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
    data: collectionsData,
    isLoading: loading,
    error: queryError,
  } = useCollections();

  const deleteCollectionMutation = useDeleteCollection();

  // Additional data for stats
  const { data: payoutsData } = usePayouts();
  const { data: chitsData } = useChits();

  // Extract collections from query data
  const collections = useMemo(() => {
    return collectionsData?.collections ?? [];
  }, [collectionsData]);

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

  const handleDeleteClick = (collection) => {
    setItemToDelete(collection);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setLocalError(null);

    deleteCollectionMutation.mutate(itemToDelete.id, {
      onSuccess: () => {
        setSuccess(`Collection record has been deleted.`);
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
      const data = await getAllCollections(filters);

      if (!data.collections || data.collections.length === 0) {
        setLocalError("No collections found for the selected criteria.");
        setReportLoading(false);
        return;
      }

      const blob = await pdf(
        <CollectionReportPDF collections={data.collections} filters={filters} />
      ).toBlob();

      let filename = "Collection_Report.pdf";

      if (filters.chitName) {
        let name = filters.chitName;
        if (!name.toLowerCase().endsWith("chit")) {
          name += " Chit";
        }
        filename = `${filters.chitName} Collections Report.pdf`;
      } else if (filters.memberName) {
        filename = `${filters.memberName} Collections Report.pdf`;
      } else if (filters.startDate) {
        const formatDateForFilename = (dateStr) => {
          if (!dateStr) return "";
          const [y, m, d] = dateStr.split("-");
          return `${d}-${m}-${y}`;
        };
        const startStr = formatDateForFilename(filters.startDate);
        const endStr = formatDateForFilename(filters.endDate);
        filename = `${startStr} to ${endStr} Collections Report.pdf`;
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
  const searchedCollections = useMemo(() => {
    if (!searchQuery) return collections;
    const lowercasedQuery = searchQuery.toLowerCase();
    return collections.filter(
      (p) =>
        p.member.full_name.toLowerCase().includes(lowercasedQuery) ||
        p.chit.name.toLowerCase().includes(lowercasedQuery) ||
        p.amount_paid.toString().includes(lowercasedQuery)
    );
  }, [collections, searchQuery]);

  // Filter by status
  const filteredCollections = useMemo(() => {
    if (!statusFilter) return searchedCollections;
    return searchedCollections.filter((c) => c.collection_status === statusFilter);
  }, [searchedCollections, statusFilter]);

  // Sort filtered collections
  const sortedCollections = useMemo(() => {
    const sorted = [...filteredCollections];
    switch (sortBy) {
      case "date_asc":
        return sorted.sort((a, b) => new Date(a.collection_date) - new Date(b.collection_date));
      case "date_desc":
        return sorted.sort((a, b) => new Date(b.collection_date) - new Date(a.collection_date));
      case "amount_asc":
        return sorted.sort((a, b) => a.amount_paid - b.amount_paid);
      case "amount_desc":
        return sorted.sort((a, b) => b.amount_paid - a.amount_paid);
      case "member_asc":
        return sorted.sort((a, b) =>
          a.member.full_name.localeCompare(b.member.full_name)
        );
      case "member_desc":
        return sorted.sort((a, b) =>
          b.member.full_name.localeCompare(a.member.full_name)
        );
      default:
        return sorted;
    }
  }, [filteredCollections, sortBy]);

  // Pagination
  const totalPages = Math.ceil(sortedCollections.length / ITEMS_PER_PAGE);
  const paginatedCollections = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedCollections.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedCollections, currentPage]);

  // Keyboard navigation
  const { focusedRowIndex, resetFocus } = useTableKeyboardNavigation({
    tableRef,
    items: paginatedCollections,
    viewMode,
    onNavigate: (collection) => navigate(`/collections/view/${collection.id}`),
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

    const payouts = payoutsData?.payouts || [];
    const chits = chitsData?.chits || [];
    const activeChits = chits.filter((c) => c.status === "Active");

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    // Calculate monthly collection target based on active chits (handle different chit types)
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
      // Auction chits: not included in fixed target
      return sum + chitTotal;
    }, 0);

    // Metric 1: Priority Collection
    const priorityCollection = (() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const unpaidCollections = collections.filter(
        (c) => c.collection_status === "Unpaid" || c.collection_status === "Partial"
      );

      if (unpaidCollections.length === 0) {
        const upcomingCollections = collections
          .filter((c) => {
            const collDate = new Date(c.collection_date);
            return collDate > today && c.collection_status === "Paid";
          })
          .sort((a, b) => new Date(a.collection_date) - new Date(b.collection_date));

        if (upcomingCollections.length === 0) return null;

        const earliestDate = upcomingCollections[0].collection_date;
        const sameDate = upcomingCollections.filter(
          (c) => c.collection_date === earliestDate
        );

        if (sameDate.length === 1) {
          return { ...sameDate[0], isUpcoming: true };
        } else {
          return {
            collection_date: earliestDate,
            amount_paid: sameDate.reduce((sum, c) => sum + c.amount_paid, 0),
            count: sameDate.length,
            isUpcoming: true,
            isAggregated: true,
          };
        }
      }

      const sortedUnpaid = unpaidCollections.sort(
        (a, b) => new Date(a.collection_date) - new Date(b.collection_date)
      );

      const earliestDate = sortedUnpaid[0].collection_date;
      const sameDate = sortedUnpaid.filter((c) => c.collection_date === earliestDate);

      if (sameDate.length === 1) {
        return { ...sameDate[0], isUpcoming: false };
      } else {
        return {
          collection_date: earliestDate,
          amount_due: sameDate.reduce(
            (sum, c) => sum + ((c.expected_amount || c.amount_paid) - c.amount_paid),
            0
          ),
          count: sameDate.length,
          isUpcoming: false,
          isAggregated: true,
        };
      }
    })();

    // Metric 2: Monthly Collection - Optimized single pass using collection_date
    // Note: Collections use actual collection_date, not scheduled dates like payouts
    const collectionMetrics = collections.reduce(
      (metrics, c) => {
        if (!c.collection_date) return metrics;
        
        const [cYear, cMonth] = c.collection_date.split("-").map(Number);
        const isThisMonth = cYear === currentYear && cMonth - 1 === currentMonth;
        
        if (!isThisMonth) return metrics;
        
        return {
          collectedAmount: metrics.collectedAmount + (c.amount_paid || 0),
          expectedAmount: metrics.expectedAmount + (c.expected_amount || c.amount_paid || 0),
          collectedCount: metrics.collectedCount + (c.collection_status === "Paid" ? 1 : 0),
          totalCount: metrics.totalCount + 1,
        };
      },
      { collectedAmount: 0, expectedAmount: 0, collectedCount: 0, totalCount: 0 }
    );

    const collectedAmount = collectionMetrics.collectedAmount;
    const expectedAmount = collectionMetrics.expectedAmount;
    const collectedCount = collectionMetrics.collectedCount;
    const totalCollectionCount = collectionMetrics.totalCount;

    // Optimized payout calculation - single pass
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
          targetAmount: metrics.targetAmount + (p.planned_amount || 0),
          paidCount: metrics.paidCount + (p.paid_date ? 1 : 0),
          totalCount: metrics.totalCount + 1,
        };
      },
      { paidAmount: 0, targetAmount: 0, paidCount: 0, totalCount: 0 }
    );

    const paidThisMonth = payoutMetrics.paidAmount;
    const monthlyPayoutTarget = payoutMetrics.targetAmount;
    const paidCount = payoutMetrics.paidCount;
    const totalScheduledCount = payoutMetrics.totalCount;

    return (
      <StatsCarousel className="mb-8">
        {/* Card 1: Priority Collection */}
        <StatsCard
          icon={priorityCollection?.isUpcoming ? Clock : AlertCircle}
          label={
            priorityCollection?.isUpcoming ? "Next Collection" : "Priority Collection"
          }
          value={
            priorityCollection ? (
              <FormattedCurrency
                amount={
                  priorityCollection.isUpcoming
                    ? priorityCollection.amount_paid
                    : priorityCollection.amount_due ||
                      (priorityCollection.expected_amount - priorityCollection.amount_paid)
                }
              />
            ) : (
              "No collections"
            )
          }
          subtext={
            !priorityCollection
              ? "All current"
              : priorityCollection.isAggregated
              ? `${priorityCollection.count} collections on ${formatDate(priorityCollection.collection_date)}`
              : formatDate(priorityCollection.collection_date)
          }
          color="accent"
        />
        {/* Card 2: Monthly Collection */}
        <StatsCard
          icon={WalletMinimal}
          label="Monthly Collection"
          value={<FormattedCurrency amount={collectedAmount} />}
          subtext={
            <span className="inline-flex items-center gap-1">
              Target: <FormattedCurrency amount={monthlyCollectionTarget} showIcon={true} />
            </span>
          }
          color="accent"
        />
        {/* Card 3: Collection Count */}
        <StatsCard
          icon={CheckCircle2}
          label="Collection Count"
          value={collectedCount}
          subtext={`Total Scheduled: ${totalCollectionCount}`}
          color="accent"
        />
        {/* Card 4: Monthly Payouts */}
        <StatsCard
          icon={TrendingUp}
          label="Monthly Payouts"
          value={<FormattedCurrency amount={paidThisMonth} />}
          subtext={
            <span className="inline-flex items-center gap-1">
              Target: <FormattedCurrency amount={monthlyPayoutTarget} showIcon={true} />
            </span>
          }
          color="accent"
        />
      </StatsCarousel>
    );
  }, [collections, payoutsData, chitsData, loading]);

  const columns = [
    {
      header: "S.No",
      accessor: "s_no",
      className: "text-center",
      cell: (row, index) => (currentPage - 1) * ITEMS_PER_PAGE + index + 1,
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
      accessor: "actions",
      className: "text-center",
      cell: (row) => (
        <div className="flex items-center justify-center space-x-2">
          <ActionButton
            icon={SquarePen}
            variant="warning"
            title="Edit Collection"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/collections/edit/${row.id}`);
            }}
          />
          <ActionButton
            icon={Trash2}
            variant="error"
            title="Delete Collection"
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
            title="All Collections"
            actionIcon={Printer}
            actionTitle="Generate Report"
            onAction={() => setIsReportModalOpen(true)}
            showAction={collections.length > 0}
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
                  <CollectionCardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Pagination Skeleton */}
            <Skeleton.Pagination />
          </>
        )}

        {/* --- Loaded State: Actual content --- */}
        {/* Overview Metrics */}
        {!loading && collections.length > 0 && metricsBlock}

        {/* Unified Search Toolbar - only show when 2+ items */}
        {!loading && collections.length >= 2 && (
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

        {!loading && sortedCollections.length === 0 && (
          <EmptyState
            icon={WalletMinimal}
            title={
              searchQuery || statusFilter
                ? "No Matching Collections"
                : "No Collections Found"
            }
            description={
              searchQuery || statusFilter
                ? "Try adjusting your search or filter."
                : "You haven't logged any collections yet. Click the + button to start!"
            }
          />
        )}

        {!loading && sortedCollections.length > 0 && (
          <>
            {viewMode === "table" ? (
              <div
                ref={tableRef}
                tabIndex={0}
                className="overflow-x-auto rounded-lg shadow-sm focus:outline-none"
              >
                <Table
                  columns={columns}
                  data={paginatedCollections}
                  onRowClick={(row) => navigate(`/collections/view/${row.id}`)}
                  focusedRowIndex={focusedRowIndex}
                />
              </div>
            ) : (
              <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedCollections.map((collection) => (
                  <StaggerItem key={collection.id}>
                    <CollectionCard
                      collection={collection}
                      onEdit={() => navigate(`/collections/edit/${collection.id}`)}
                      onDelete={() => handleDeleteClick(collection)}
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
      <Link to="/collections/create" className="group">
        <Button variant="fab" className="group-hover:scale-110">
          <Plus className="w-6 h-6" />
        </Button>
      </Link>

      {/* Report Modal */}
      <CollectionReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onGenerate={handleGenerateReport}
        loading={reportLoading}
      />

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Collection?"
        message={`Are you sure you want to permanently delete this collection record? This action cannot be undone.`}
        loading={deleteCollectionMutation.isPending}
      />
    </>
  );
};

export default CollectionsPage;
