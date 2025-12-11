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
} from "lucide-react";

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
      <div className="container mx-auto">
        {/* Page Header */}
        <PageHeader
          title="All Collections"
          actionIcon={Printer}
          actionTitle="Generate Report"
          onAction={() => setIsReportModalOpen(true)}
          showAction={collections.length > 0}
        />

        <hr className="my-4 border-border" />

        {success && <Message type="success">{success}</Message>}
        {error && (
          <Message type="error" onClose={() => setLocalError(null)}>
            {error}
          </Message>
        )}

        {/* Unified Search Toolbar - only show when 2+ items */}
        {collections.length >= 2 && (
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
                <CollectionCardSkeleton key={i} />
              ))}
            </div>
          )
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
