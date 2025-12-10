// frontend/src/features/payouts/pages/PayoutsPage.jsx

import { useState, useEffect, useMemo } from "react";
import useScrollToTop from "../../../hooks/useScrollToTop";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getAllPayouts, deletePayout } from "../../../services/payoutsService";
import { useSelector } from "react-redux";
import Message from "../../../components/ui/Message";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import Table from "../../../components/ui/Table";
import StatusBadge from "../../../components/ui/StatusBadge";
import PageHeader from "../../../components/ui/PageHeader";
import SearchToolbar from "../../../components/ui/SearchToolbar";
import ActionButton from "../../../components/ui/ActionButton";
import PayoutCard from "../components/cards/PayoutCard";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";
import {
  Plus,
  Loader2,
  SquarePen,
  Trash2,
  Printer,
  TrendingUp,
  ArrowLeft,
  ArrowRight,
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

  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [sortBy, setSortBy] = useState("date_desc");
  const [currentPage, setCurrentPage] = useState(1);
  const { isLoggedIn } = useSelector((state) => state.auth);

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
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  useScrollToTop(success || error);

  // Persist view mode to localStorage
  useEffect(() => {
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
  }, [viewMode]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllPayouts();
      setPayouts(Array.isArray(data) ? data : data.payouts || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
    }
  }, [isLoggedIn]);

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
  }, [searchQuery, statusFilter, sortBy]);

  const handleDeleteClick = (payout) => {
    setItemToDelete(payout);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleteLoading(true);
    setError(null);
    try {
      await deletePayout(itemToDelete.id);
      fetchData();
      setSuccess(`Payout record has been deleted.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleteLoading(false);
      setIsModalOpen(false);
      setItemToDelete(null);
    }
  };

  const handleGenerateReport = async (filters) => {
    setReportLoading(true);
    setError(null);
    try {
      const data = await getAllPayouts(filters);
      const reportPayouts = Array.isArray(data) ? data : data.payouts || [];

      if (!reportPayouts || reportPayouts.length === 0) {
        setError("No payouts found for the selected criteria.");
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
      setError(err.message || "Failed to generate report.");
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
          <Message type="error" onClose={() => setError(null)}>
            {error}
          </Message>
        )}

        {/* Unified Search Toolbar */}
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

        {loading && (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-10 h-10 animate-spin text-accent" />
          </div>
        )}

        {!loading && !error && sortedPayouts.length === 0 && (
          <Card className="text-center p-8">
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              {searchQuery || statusFilter ? "No Matching Payouts" : "No Payouts Found"}
            </h2>
            <p className="text-text-secondary">
              {searchQuery || statusFilter
                ? "Try adjusting your search or filter."
                : "You haven't recorded any payouts yet. Click the button below to start!"}
            </p>
          </Card>
        )}

        {!loading && !error && sortedPayouts.length > 0 && (
          <>
            {viewMode === "table" ? (
              <div className="overflow-x-auto rounded-lg shadow-sm">
                <Table
                  columns={columns}
                  data={paginatedPayouts}
                  onRowClick={(row) =>
                    navigate(`/payouts/view/${row.id}`)
                  }
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedPayouts.map((payout) => (
                  <PayoutCard
                    key={payout.id}
                    payout={payout}
                    onView={() =>
                      navigate(`/payouts/view/${payout.id}`)
                    }
                    onDelete={() => handleDeleteClick(payout)}
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
        loading={deleteLoading}
      />
    </>
  );
};

export default PayoutsPage;
