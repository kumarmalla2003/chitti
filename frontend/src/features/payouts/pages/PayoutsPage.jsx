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
} from "lucide-react";

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
      <div className="container mx-auto">
        {/* Page Header */}
        <PageHeader
          title="All Payouts"
          actionIcon={Printer}
          actionTitle="Generate Report"
          onAction={() => setIsReportModalOpen(true)}
          showAction={payouts.length > 0}
        />

        <hr className="my-4 border-border" />

        {success && <Message type="success">{success}</Message>}
        {error && (
          <Message type="error" onClose={() => setLocalError(null)}>
            {error}
          </Message>
        )}

        {/* Unified Search Toolbar - only show when 2+ items */}
        {payouts.length >= 2 && (
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

        {loading && (
          viewMode === "table" ? (
            <Skeleton.Table rows={5} columns={7} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <PayoutCardSkeleton key={i} />
              ))}
            </div>
          )
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedPayouts.map((payout) => (
                  <PayoutCard
                    key={payout.id}
                    payout={payout}
                    onView={() => navigate(`/payouts/view/${payout.id}`)}
                    onEdit={() => navigate(`/payouts/edit/${payout.id}`)}
                    onDelete={() => handleDeleteClick(payout)}
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
