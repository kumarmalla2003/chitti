// frontend/src/features/chits/pages/ChitsPage.jsx

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import useScrollToTop from "../../../hooks/useScrollToTop";
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
import {
  Plus,
  SquarePen,
  Trash2,
  Printer,
  FileStack,
  ArrowLeft,
  ArrowRight,
  IndianRupee,
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
  const [focusedRowIndex, setFocusedRowIndex] = useState(-1);

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
    setFocusedRowIndex(-1);
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
  const handleKeyDown = useCallback(
    (e) => {
      if (viewMode !== "table" || paginatedChits.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedRowIndex((prev) =>
          prev < paginatedChits.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedRowIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === "Enter" && focusedRowIndex >= 0) {
        e.preventDefault();
        navigate(`/chits/view/${paginatedChits[focusedRowIndex].id}`);
      }
    },
    [viewMode, paginatedChits, focusedRowIndex, navigate]
  );

  useEffect(() => {
    const tableEl = tableRef.current;
    if (tableEl) {
      tableEl.addEventListener("keydown", handleKeyDown);
      return () => tableEl.removeEventListener("keydown", handleKeyDown);
    }
  }, [handleKeyDown]);

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
        <span className="inline-flex items-center justify-center">
          <IndianRupee className="w-[1em] h-[1em]" />
          {row.chit_value.toLocaleString("en-IN")}
        </span>
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

        {/* Unified Search Toolbar */}
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
            icon={FileStack}
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
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4 w-full px-2 text-sm text-text-secondary">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-full hover:bg-background-secondary hover:text-text-primary disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <span className="font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-full hover:bg-background-secondary hover:text-text-primary disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <Link to="/chits/create" className="chit">
        <Button variant="fab" className="chit-hover:scale-110">
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
