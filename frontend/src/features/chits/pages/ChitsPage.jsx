// frontend/src/features/chits/pages/ChitsPage.jsx

import { useState, useEffect, useMemo, useRef } from "react";
import useScrollToTop from "../../../hooks/useScrollToTop";
import useTableKeyboardNavigation from "../../../hooks/useTableKeyboardNavigation";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ChitCard from "../components/cards/ChitCard";
import ChitCardSkeleton from "../components/cards/ChitCardSkeleton";
import Skeleton from "../../../components/ui/Skeleton";
import EmptyState from "../../../components/ui/EmptyState";
import { useChits, useDeleteChit } from "../hooks/useChits";
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
} from "lucide-react";

import ChitsListReportPDF from "../components/reports/ChitsListReportPDF";
import ChitReportPDF from "../components/reports/ChitReportPDF";
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
  const [viewMode, setViewMode] = useState(() => {
    const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    if (stored === "table" || stored === "card") {
      return stored;
    }
    return window.innerWidth < 768 ? "card" : "table";
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Persist view mode to localStorage
  useEffect(() => {
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
  }, [viewMode]);

  // React Query hooks
  const {
    data: chitsData,
    isLoading: loading,
    error: queryError,
  } = useChits();

  const deleteChitMutation = useDeleteChit();

  // Extract chits from query data and add calculated status
  const chits = useMemo(() => {
    const rawChits = chitsData?.chits ?? [];
    return rawChits.map((chit) => ({
      ...chit,
      calculatedStatus: calculateChitStatus(chit),
    }));
  }, [chitsData]);

  // Combine query error with local error
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
    return searchedChits.filter((chit) => chit.calculatedStatus === statusFilter);
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
        return sorted.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
      case "date_desc":
        return sorted.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
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
        <ChitsListReportPDF chits={sortedChits} />
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
      className: "text-center",
      cell: (row, index) => (currentPage - 1) * ITEMS_PER_PAGE + index + 1,
    },
    {
      header: "Chit Name",
      accessor: "name",
      className: "text-center",
    },
    {
      header: "Chit Value",
      accessor: "chit_value",
      className: "text-center",
      cell: (row) => (
        <FormattedCurrency amount={row.chit_value} className="justify-center" />
      ),
    },
    {
      header: "Chit Cycle",
      accessor: "chit_cycle",
      className: "text-center",
    },
    {
      header: "Status",
      accessor: "status",
      className: "text-center",
      cell: (row) => <StatusBadge status={row.calculatedStatus} />,
    },
    {
      header: "Actions",
      accessor: "actions",
      className: "text-center",
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
      <div className="container mx-auto">
        {/* Page Header */}
        <PageHeader
          title="All Chits"
          actionIcon={Printer}
          actionTitle="Print All Chits"
          onAction={handlePrintAll}
          isLoading={isPrintingAll}
          showAction={sortedChits.length > 0}
        />

        <hr className="my-4 border-border" />

        {success && <Message type="success">{success}</Message>}
        {error && (
          <Message type="error" onClose={() => setLocalError(null)}>
            {error}
          </Message>
        )}

        {/* Unified Search Toolbar - only show when 2+ items */}
        {chits.length >= 2 && (
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

        {loading && (
          viewMode === "table" ? (
            <Skeleton.Table rows={5} columns={6} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <ChitCardSkeleton key={i} />
              ))}
            </div>
          )
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedChits.map((chit) => (
                  <ChitCard
                    key={chit.id}
                    chit={{ ...chit, status: chit.calculatedStatus }}
                    onView={() => navigate(`/chits/view/${chit.id}`)}
                    onEdit={() => navigate(`/chits/edit/${chit.id}`)}
                    onDelete={() => handleDeleteClick(chit)}
                    onPrint={handlePrintChit}
                    isPrinting={printingChitId === chit.id}
                  />
                ))}
              </div>
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
