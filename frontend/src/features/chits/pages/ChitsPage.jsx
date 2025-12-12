// frontend/src/features/chits/pages/ChitsPage.jsx

import { useState, useEffect, useMemo, useRef } from "react";
import useScrollToTop from "../../../hooks/useScrollToTop";
import useTableKeyboardNavigation from "../../../hooks/useTableKeyboardNavigation";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ChitCard from "../components/cards/ChitCard";
import ChitCardSkeleton from "../components/cards/ChitCardSkeleton";
import Skeleton from "../../../components/ui/Skeleton";
import StaggerContainer from "../../../components/ui/StaggerContainer";
import StaggerItem from "../../../components/ui/StaggerItem";
import EmptyState from "../../../components/ui/EmptyState";
import { useChits, useDeleteChit } from "../hooks/useChits";
import { useCollections } from "../../collections/hooks/useCollections";
import { usePayouts } from "../../payouts/hooks/usePayouts";
import { getPayoutsByChitId } from "../../../services/payoutsService";
import { getAssignmentsForChit } from "../../../services/assignmentsService";
import { getCollectionsByChitId } from "../../../services/collectionsService";
import Message from "../../../components/ui/Message";
import Button from "../../../components/ui/Button";
import Table from "../../../components/ui/Table";
import StatusBadge from "../../../components/ui/StatusBadge";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";
import PageHeader from "../../../components/ui/PageHeader";
import SearchToolbar from "../../../components/ui/SearchToolbar";
import ActionButton from "../../../components/ui/ActionButton";
import Pagination from "../../../components/ui/Pagination";
import FormattedCurrency from "../../../components/ui/FormattedCurrency";
import {
  Plus,
  SquarePen,
  Trash2,
  Printer,
  Layers,
  WalletMinimal,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";

import ChitsListReportPDF from "../components/reports/ChitsListReportPDF";
import ChitReportPDF from "../components/reports/ChitReportPDF";
import StatsCard from "../../../components/ui/StatsCard";
import StatsCarousel from "../../../components/ui/StatsCarousel";
import { pdf } from "@react-pdf/renderer";

const ITEMS_PER_PAGE = 10;
const VIEW_MODE_STORAGE_KEY = "chitsViewMode";

const STATUS_OPTIONS = [
  { value: "Active", label: "Active" },
  { value: "Upcoming", label: "Upcoming" },
  { value: "Completed", label: "Completed" },
];

const SORT_OPTIONS = [
  { value: "name_asc", label: "Name (A-Z)" },
  { value: "name_desc", label: "Name (Z-A)" },
  { value: "value_asc", label: "Value (Low-High)" },
  { value: "value_desc", label: "Value (High-Low)" },
  { value: "date_asc", label: "Start Date (Oldest)" },
  { value: "date_desc", label: "Start Date (Newest)" },
];

/**
 * Calculate chit status based on start_date and end_date.
 * - Upcoming: start_date is in the future
 * - Completed: end_date is in the past
 * - Active: otherwise
 */
const calculateChitStatus = (chit) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = chit.start_date ? new Date(chit.start_date) : null;
  const endDate = chit.end_date ? new Date(chit.end_date) : null;

  if (startDate) {
    startDate.setHours(0, 0, 0, 0);
  }
  if (endDate) {
    endDate.setHours(0, 0, 0, 0);
  }

  if (startDate && startDate > today) {
    return "Upcoming";
  }
  if (endDate && endDate < today) {
    return "Completed";
  }
  return "Active";
};

/**
 * ChitsPage component - displays a list of all chits with search, filtering, sorting, and CRUD operations.
 * Uses React Query for data fetching and caching.
 */
const ChitsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const tableRef = useRef(null);

  const [success, setSuccess] = useState(null);
  const [localError, setLocalError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState(null); // null = "All"
  const [sortBy, setSortBy] = useState("name_asc");

  const [isPrintingAll, setIsPrintingAll] = useState(false);
  const [printingChitId, setPrintingChitId] = useState(null);

  // Initialize view mode from localStorage, fallback to responsive default
  // Initialize view mode from localStorage, fallback to responsive default
  const [viewMode, setViewMode] = useState(() => {
    // If mobile, force card view regardless of storage (or fallback) to prevent broken tables
    if (window.innerWidth < 768) return "card";

    const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    if (stored === "table" || stored === "card") {
      return stored;
    }
    return "table";
  });

  // Automatically switch view mode based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setViewMode("card");
      } else {
        setViewMode("table");
      }
    };

    // Correct initial check handled by useState, but consistent resize listener essential
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Persist view mode to localStorage
  useEffect(() => {
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
  }, [viewMode]);

  // React Query hooks
  const {
    data: chitsData,
    isLoading: chitsLoading,
    error: queryError,
  } = useChits();

  const { data: collectionsData, isLoading: collectionsLoading } =
    useCollections();
  const { data: payoutsData, isLoading: payoutsLoading } = usePayouts();

  const loading = chitsLoading || collectionsLoading || payoutsLoading;

  const deleteChitMutation = useDeleteChit();

  // Extract chits from query data and add calculated status
  const chits = useMemo(() => {
    const rawChits = chitsData?.chits ?? [];
    return rawChits.map((chit) => ({
      ...chit,
      calculatedStatus: calculateChitStatus(chit),
    }));
  }, [chitsData]);

  // Metrics Block (conditional display in JSX)
  const metricsBlock = useMemo(() => {
    if (loading) return null;

    // --- Metric Calculations ---
    const activeChits = chits.filter((c) => c.calculatedStatus === "Active");

    const monthlyCollectionTarget = activeChits.reduce(
      (sum, c) => sum + c.monthly_installment * c.size,
      0
    );

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    // ========================================================================
    // OPTIMIZED PAYOUT LOGIC - Single Pass
    // ========================================================================
    
    // Calculate all metrics in a single pass through the payouts array
    const payoutMetrics = (payoutsData?.payouts || []).reduce(
      (metrics, p) => {
        // Ensure we have necessary chit data
        if (!p.chit || !p.chit.start_date) return metrics;

        // Parse the Chit's Start Date and calculate scheduled date
        const chitStartDate = new Date(p.chit.start_date);
        const scheduledDate = new Date(chitStartDate);
        scheduledDate.setMonth(chitStartDate.getMonth() + (p.month - 1));

        // Check if this payout is scheduled for current month/year
        const isThisMonth =
          scheduledDate.getMonth() === currentMonth &&
          scheduledDate.getFullYear() === currentYear;

        if (!isThisMonth) return metrics;

        // Accumulate metrics for payouts scheduled this month
        return {
          paidAmount: metrics.paidAmount + (p.paid_date ? (p.amount || 0) : 0),
          targetAmount: metrics.targetAmount + (p.planned_amount || 0),
          paidCount: metrics.paidCount + (p.paid_date ? 1 : 0),
          totalCount: metrics.totalCount + 1,
        };
      },
      { paidAmount: 0, targetAmount: 0, paidCount: 0, totalCount: 0 }
    );

    // Extract values for clarity
    const paidThisMonth = payoutMetrics.paidAmount;
    const monthlyPayoutTarget = payoutMetrics.targetAmount;
    const paidCount = payoutMetrics.paidCount;
    const totalScheduledCount = payoutMetrics.totalCount;

    // ========================================================================
    // END OPTIMIZED LOGIC
    // ========================================================================

    const collectedThisMonth = (collectionsData?.collections || []).reduce(
      (sum, p) => {
        if (!p.collection_date) return sum;
        const [pYear, pMonth] = p.collection_date.split("-").map(Number);
        if (pYear === currentYear && pMonth - 1 === currentMonth) {
          return sum + (p.amount_paid || 0);
        }
        return sum;
      },
      0
    );

    return (
      <StatsCarousel className="mb-8">
        {/* Card 1: Monthly Payouts */}
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
        {/* Card 2: Monthly Collection */}
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
        {/* Card 3: Active Chits */}
        <StatsCard
          icon={Layers}
          label="Active Chits"
          value={activeChits.length}
          subtext={`Total Chits: ${chits.length}`}
          color="accent"
        />
        {/* Card 4: Payout Count */}
        <StatsCard
          icon={CheckCircle2}
          label="Payout Count"
          value={paidCount}
          subtext={`Total Scheduled: ${totalScheduledCount}`}
          color="accent"
        />
      </StatsCarousel>
    );
  }, [chits, collectionsData, payoutsData, loading]);

  // Combined query error with local error
  const error = localError || (queryError?.message ?? null);

  useScrollToTop(success || error);

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

  const handleDeleteClick = (chit) => {
    setItemToDelete(chit);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setLocalError(null);

    deleteChitMutation.mutate(itemToDelete.id, {
      onSuccess: () => {
        setSuccess(`Chit "${itemToDelete.name}" has been deleted.`);
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

  // Filter by search query
  const searchedChits = useMemo(() => {
    if (!searchQuery) {
      return chits;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    return chits.filter((chit) => {
      const nameMatch = chit.name.toLowerCase().includes(lowercasedQuery);
      const valueMatch = chit.chit_value.toString().includes(lowercasedQuery);
      return nameMatch || valueMatch;
    });
  }, [chits, searchQuery]);

  // Filter by status
  const filteredChits = useMemo(() => {
    if (!statusFilter) {
      return searchedChits;
    }
    return searchedChits.filter(
      (chit) => chit.calculatedStatus === statusFilter
    );
  }, [searchedChits, statusFilter]);

  // Sort filtered chits
  const sortedChits = useMemo(() => {
    const sorted = [...filteredChits];
    switch (sortBy) {
      case "name_asc":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case "name_desc":
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      case "value_asc":
        return sorted.sort((a, b) => a.chit_value - b.chit_value);
      case "value_desc":
        return sorted.sort((a, b) => b.chit_value - a.chit_value);
      case "date_asc":
        return sorted.sort(
          (a, b) => new Date(a.start_date) - new Date(b.start_date)
        );
      case "date_desc":
        return sorted.sort(
          (a, b) => new Date(b.start_date) - new Date(a.start_date)
        );
      default:
        return sorted;
    }
  }, [filteredChits, sortBy]);

  // Pagination
  const totalPages = Math.ceil(sortedChits.length / ITEMS_PER_PAGE);
  const paginatedChits = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedChits.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedChits, currentPage]);

  // Keyboard navigation
  const { focusedRowIndex, resetFocus } = useTableKeyboardNavigation({
    tableRef,
    items: paginatedChits,
    viewMode,
    onNavigate: (chit) => navigate(`/chits/view/${chit.id}`),
  });

  const handlePrintAll = async () => {
    if (sortedChits.length === 0) return;

    setIsPrintingAll(true);
    try {
      const blob = await pdf(
        <ChitsListReportPDF
          chits={sortedChits}
          collections={collectionsData?.collections || []}
          payouts={payoutsData?.payouts || []}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "All Chits Report.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Print failed", err);
      setLocalError("Failed to generate report.");
    } finally {
      setIsPrintingAll(false);
    }
  };

  const handlePrintChit = async (chit) => {
    setPrintingChitId(chit.id);
    setLocalError(null);

    try {
      const [payoutsData, assignmentsData, collectionsData] = await Promise.all(
        [
          getPayoutsByChitId(chit.id),
          getAssignmentsForChit(chit.id),
          getCollectionsByChitId(chit.id),
        ]
      );

      const reportProps = {
        chit: chit,
        payouts: payoutsData.payouts,
        assignments: assignmentsData.assignments,
        collections: collectionsData.collections,
      };

      let reportName = chit.name;
      if (!reportName.toLowerCase().endsWith("chit")) {
        reportName += " Chit";
      }
      reportName += " Report";

      const blob = await pdf(<ChitReportPDF {...reportProps} />).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${reportName}.pdf`;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Single chit print failed", err);
      setLocalError("Failed to generate report for this chit.");
    } finally {
      setPrintingChitId(null);
    }
  };

  const columns = [
    {
      header: "S.No",
      accessor: "s_no",
      className: "text-center w-16",
      cell: (row, index) => (currentPage - 1) * ITEMS_PER_PAGE + index + 1,
    },
    {
      header: "Chit Name",
      accessor: "name",
      className: "text-center w-1/4",
    },
    {
      header: "Chit Value",
      accessor: "chit_value",
      className: "text-center w-1/6",
      cell: (row) => (
        <FormattedCurrency amount={row.chit_value} className="justify-center" />
      ),
    },
    {
      header: "Installment",
      accessor: "monthly_installment",
      className: "text-center w-1/6",
      cell: (row) => (
        <FormattedCurrency
          amount={row.monthly_installment}
          className="justify-center"
        />
      ),
    },
    {
      header: "Chit Cycle",
      accessor: "chit_cycle",
      className: "text-center w-1/6",
    },
    {
      header: "Status",
      accessor: "status",
      className: "text-center w-24",
      cell: (row) => <StatusBadge status={row.calculatedStatus} />,
    },
    {
      header: "Actions",
      accessor: "actions",
      className: "text-center w-32",
      cell: (row) => (
        <div className="flex items-center justify-center space-x-2">
          <ActionButton
            icon={Printer}
            variant="info"
            title="Download PDF"
            onClick={(e) => {
              e.stopPropagation();
              handlePrintChit(row);
            }}
            isLoading={printingChitId === row.id}
          />
          <ActionButton
            icon={SquarePen}
            variant="warning"
            title="Edit Chit"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/chits/edit/${row.id}`);
            }}
          />
          <ActionButton
            icon={Trash2}
            variant="error"
            title="Delete Chit"
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
            title="All Chits"
            actionIcon={Printer}
            actionTitle="Print All Chits"
            onAction={handlePrintAll}
            isLoading={isPrintingAll}
            showAction={sortedChits.length > 0}
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

            {/* Table/Card Skeletons */}
            {viewMode === "table" ? (
              <Skeleton.Table
                rows={ITEMS_PER_PAGE}
                columnWidths={[
                  "w-16", // S.No
                  "w-1/4", // Chit Name
                  "w-1/6", // Chit Value
                  "w-1/6", // Installment
                  "w-1/6", // Chit Cycle
                  "w-24", // Status
                  "w-32", // Actions
                ]}
                serialColumnIndex={0}
                statusColumnIndex={5}
                actionColumnIndex={6}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
                  <ChitCardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Pagination Skeleton */}
            <Skeleton.Pagination />
          </>
        )}

        {/* --- Loaded State: Actual content --- */}
        {/* Overview Metrics */}
        {!loading && chits.length > 0 && metricsBlock}

        {/* Unified Search Toolbar - only show when 2+ items */}
        {!loading && chits.length >= 2 && (
          <SearchToolbar
            searchPlaceholder="Search by name or value..."
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

        {!loading && sortedChits.length === 0 && (
          <EmptyState
            icon={Layers}
            title={
              searchQuery || statusFilter
                ? "No Matching Chits"
                : "No Chits Found"
            }
            description={
              searchQuery || statusFilter
                ? "Try adjusting your search or filter."
                : "You don't have any chits yet. Click the + button to create one!"
            }
          />
        )}

        {!loading && sortedChits.length > 0 && (
          <>
            {/* Table view on desktop, Card view on mobile (unless toggled) */}
            {viewMode === "table" ? (
              <div
                ref={tableRef}
                tabIndex={0}
                className="overflow-x-auto rounded-lg shadow-sm focus:outline-none"
              >
                <Table
                  columns={columns}
                  data={paginatedChits}
                  onRowClick={(row) => navigate(`/chits/view/${row.id}`)}
                  focusedRowIndex={focusedRowIndex}
                />
              </div>
            ) : (
              <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedChits.map((chit) => (
                  <StaggerItem key={chit.id}>
                    <ChitCard
                      chit={{ ...chit, status: chit.calculatedStatus }}
                      onView={() => navigate(`/chits/view/${chit.id}`)}
                      onEdit={() => navigate(`/chits/edit/${chit.id}`)}
                      onDelete={() => handleDeleteClick(chit)}
                      onPrint={handlePrintChit}
                      isPrinting={printingChitId === chit.id}
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

      <Link to="/chits/create" className="group">
        <Button variant="fab" className="group-hover:scale-110">
          <Plus className="w-6 h-6" />
        </Button>
      </Link>
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Chit?"
        message={`Are you sure you want to permanently delete "${itemToDelete?.name}"? This action cannot be undone.`}
        loading={deleteChitMutation.isPending}
      />
    </>
  );
};

export default ChitsPage;