// frontend/src/features/members/pages/MembersPage.jsx

import { useState, useEffect, useMemo, useRef } from "react";
import useScrollToTop from "../../../hooks/useScrollToTop";
import useTableKeyboardNavigation from "../../../hooks/useTableKeyboardNavigation";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMembers, useDeleteMember } from "../hooks/useMembers";
import { getAssignmentsForMember } from "../../../services/assignmentsService";
import { getCollectionsByMemberId } from "../../../services/collectionsService";
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
import MemberCard from "../components/cards/MemberCard";
import MemberCardSkeleton from "../components/cards/MemberCardSkeleton";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";
import {
  Plus,
  Printer,
  SquarePen,
  Trash2,
  Users,
} from "lucide-react";

import MembersListReportPDF from "../components/reports/MembersListReportPDF";
import MemberReportPDF from "../components/reports/MemberReportPDF";
import { pdf } from "@react-pdf/renderer";

const ITEMS_PER_PAGE = 10;
const VIEW_MODE_STORAGE_KEY = "membersViewMode";

const STATUS_OPTIONS = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

const SORT_OPTIONS = [
  { value: "name_asc", label: "Name (A-Z)" },
  { value: "name_desc", label: "Name (Z-A)" },
  { value: "phone_asc", label: "Phone (Ascending)" },
  { value: "phone_desc", label: "Phone (Descending)" },
];

/**
 * Calculate member status based on active chit participation.
 * - Active: Member is assigned to at least one active chit
 * - Inactive: Member has no active chit assignments
 */
const calculateMemberStatus = (member) => {
  // Check if member has active_chits_count or similar field
  // If member has assignments with active chits, they're active
  const activeCount = member.active_chits_count || 0;
  return activeCount > 0 ? "Active" : "Inactive";
};

/**
 * MembersPage component - displays a list of all members with search, view toggle, and CRUD operations.
 * Uses React Query for data fetching and caching.
 */
const MembersPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const tableRef = useRef(null);

  const [success, setSuccess] = useState(null);
  const [localError, setLocalError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [sortBy, setSortBy] = useState("name_asc");
  const [currentPage, setCurrentPage] = useState(1);

  // Initialize view mode from localStorage, fallback to responsive default
  const [viewMode, setViewMode] = useState(() => {
    const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    if (stored === "table" || stored === "card") {
      return stored;
    }
    return window.innerWidth < 768 ? "card" : "table";
  });

  const [isPrintingAll, setIsPrintingAll] = useState(false);
  const [printingMemberId, setPrintingMemberId] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // React Query hooks
  const {
    data: membersData,
    isLoading: loading,
    error: queryError,
  } = useMembers();

  const deleteMemberMutation = useDeleteMember();

  // Extract members from query data and add calculated status
  const members = useMemo(() => {
    const rawMembers = membersData?.members ?? [];
    return rawMembers.map((member) => ({
      ...member,
      calculatedStatus: calculateMemberStatus(member),
    }));
  }, [membersData]);

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

  const handleDeleteClick = (member) => {
    setItemToDelete(member);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setLocalError(null);

    deleteMemberMutation.mutate(itemToDelete.id, {
      onSuccess: () => {
        setSuccess(`Member "${itemToDelete.full_name}" has been deleted.`);
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
  const searchedMembers = useMemo(() => {
    if (!searchQuery) return members;
    const lowercasedQuery = searchQuery.toLowerCase();
    return members.filter(
      (member) =>
        member.full_name.toLowerCase().includes(lowercasedQuery) ||
        member.phone_number.includes(lowercasedQuery)
    );
  }, [members, searchQuery]);

  // Filter by status
  const filteredMembers = useMemo(() => {
    if (!statusFilter) return searchedMembers;
    return searchedMembers.filter((m) => m.calculatedStatus === statusFilter);
  }, [searchedMembers, statusFilter]);

  // Sort filtered members
  const sortedMembers = useMemo(() => {
    const sorted = [...filteredMembers];
    switch (sortBy) {
      case "name_asc":
        return sorted.sort((a, b) => a.full_name.localeCompare(b.full_name));
      case "name_desc":
        return sorted.sort((a, b) => b.full_name.localeCompare(a.full_name));
      case "phone_asc":
        return sorted.sort((a, b) => a.phone_number.localeCompare(b.phone_number));
      case "phone_desc":
        return sorted.sort((a, b) => b.phone_number.localeCompare(a.phone_number));
      default:
        return sorted;
    }
  }, [filteredMembers, sortBy]);

  // Pagination
  const totalPages = Math.ceil(sortedMembers.length / ITEMS_PER_PAGE);
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedMembers.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedMembers, currentPage]);

  // Keyboard navigation
  const { focusedRowIndex, resetFocus } = useTableKeyboardNavigation({
    tableRef,
    items: paginatedMembers,
    viewMode,
    onNavigate: (member) => navigate(`/members/view/${member.id}`),
  });

  const handlePrintAll = async () => {
    if (sortedMembers.length === 0) return;

    setIsPrintingAll(true);
    try {
      const blob = await pdf(
        <MembersListReportPDF members={sortedMembers} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "All Members Report.pdf";
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

  const handlePrintMember = async (member) => {
    setPrintingMemberId(member.id);
    setLocalError(null);

    try {
      const [assignmentsData, collectionsData] = await Promise.all([
        getAssignmentsForMember(member.id),
        getCollectionsByMemberId(member.id),
      ]);

      const reportProps = {
        member: member,
        assignments: assignmentsData,
        collections: collectionsData.collections,
      };

      const reportName = `${member.full_name} Report`;

      const blob = await pdf(<MemberReportPDF {...reportProps} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${reportName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Single member print failed", err);
      setLocalError("Failed to generate report for this member.");
    } finally {
      setPrintingMemberId(null);
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
      header: "Full Name",
      accessor: "full_name",
      className: "text-left",
    },
    {
      header: "Phone Number",
      accessor: "phone_number",
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
              handlePrintMember(row);
            }}
            isLoading={printingMemberId === row.id}
          />
          <ActionButton
            icon={SquarePen}
            variant="warning"
            title="Edit Member"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/members/edit/${row.id}`);
            }}
          />
          <ActionButton
            icon={Trash2}
            variant="error"
            title="Delete Member"
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
          title="All Members"
          actionIcon={Printer}
          actionTitle="Print All Members"
          onAction={handlePrintAll}
          isLoading={isPrintingAll}
          showAction={sortedMembers.length > 0}
        />

        <hr className="my-4 border-border" />

        {success && <Message type="success">{success}</Message>}
        {error && (
          <Message type="error" onClose={() => setLocalError(null)}>
            {error}
          </Message>
        )}

        {/* Unified Search Toolbar - only show when 2+ items */}
        {members.length >= 2 && (
          <SearchToolbar
            searchPlaceholder="Search by name or phone number..."
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
            <Skeleton.Table rows={5} columns={5} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <MemberCardSkeleton key={i} />
              ))}
            </div>
          )
        )}

        {!loading && sortedMembers.length === 0 && (
          <EmptyState
            icon={Users}
            title={
              searchQuery || statusFilter
                ? "No Matching Members"
                : "No Members Found"
            }
            description={
              searchQuery || statusFilter
                ? "Try adjusting your search or filter."
                : "You haven't added any members yet. Click the + button to create one!"
            }
          />
        )}

        {!loading && sortedMembers.length > 0 && (
          <>
            {viewMode === "table" ? (
              <div
                ref={tableRef}
                tabIndex={0}
                className="overflow-x-auto rounded-lg shadow-sm focus:outline-none"
              >
                <Table
                  columns={columns}
                  data={paginatedMembers}
                  onRowClick={(row) => navigate(`/members/view/${row.id}`)}
                  focusedRowIndex={focusedRowIndex}
                />
              </div>
            ) : (
              <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedMembers.map((member) => (
                  <StaggerItem key={member.id}>
                    <MemberCard
                      member={{ ...member, status: member.calculatedStatus }}
                      onView={() => navigate(`/members/view/${member.id}`)}
                      onEdit={() => navigate(`/members/edit/${member.id}`)}
                      onDelete={() => handleDeleteClick(member)}
                      onPrint={handlePrintMember}
                      isPrinting={printingMemberId === member.id}
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

      <Link to="/members/create" className="group">
        <Button variant="fab" className="group-hover:scale-110">
          <Plus className="w-6 h-6" />
        </Button>
      </Link>
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Member?"
        message={`Are you sure you want to permanently delete "${itemToDelete?.full_name}"? This action cannot be undone.`}
        loading={deleteMemberMutation.isPending}
      />
    </>
  );
};

export default MembersPage;
