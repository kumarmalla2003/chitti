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
  WalletMinimal,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import StatsCard from "../../../components/ui/StatsCard";
import StatsCarousel from "../../../components/ui/StatsCarousel";
import FormattedCurrency from "../../../components/ui/FormattedCurrency";
import { useCollections } from "../../collections/hooks/useCollections";
import { usePayouts } from "../../payouts/hooks/usePayouts";
import { useChits } from "../../chits/hooks/useChits";

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

  // Additional data for stats
  const { data: collectionsData } = useCollections();
  const { data: payoutsData } = usePayouts();
  const { data: chitsData } = useChits();

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
      const reportName = `All Members Report`;
      const blob = await pdf(
        <MembersListReportPDF
          members={sortedMembers}
          collections={collectionsData?.collections || []}
          payouts={payoutsData?.payouts || []}
          chits={chitsData?.chits || []}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${reportName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Print all failed", err);
      setLocalError("Failed to generate report for all members.");
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

  // Metrics Block
  const metricsBlock = useMemo(() => {
    if (loading) return null;

    const collections = collectionsData?.collections || [];
    const payouts = payoutsData?.payouts || [];
    const chits = chitsData?.chits || [];
    const activeChits = chits.filter((c) => c.status === "Active");

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    // Metric 1: Monthly Collection (same as ChitsPage)
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
        };
      },
      { paidAmount: 0, targetAmount: 0 }
    );

    const paidThisMonth = payoutMetrics.paidAmount;
    const monthlyPayoutTarget = payoutMetrics.targetAmount;

    // Collection Count - for Card 4
    const collectionsThisMonth = collections.filter((c) => {
      if (!c.collection_date) return false;
      const [cYear, cMonth] = c.collection_date.split("-").map(Number);
      return cYear === currentYear && cMonth - 1 === currentMonth;
    });

    const collectedCount = collectionsThisMonth.filter(
      (c) => c.collection_status === "Paid"
    ).length;

    // Metric 3: Active Members
    const activeMembers = members.filter((m) => (m.active_chits_count || 0) > 0);

    // Metric 4: Pending Collections Count (members with pending collections this month)
    const membersWithPending = new Set();
    collections.forEach((c) => {
      if (!c.collection_date) return;
      const [cYear, cMonth] = c.collection_date.split("-").map(Number);
      if (cYear === currentYear && cMonth - 1 === currentMonth) {
        if (c.collection_status === "Unpaid" || c.collection_status === "Partial") {
          if (c.member?.id) {
            membersWithPending.add(c.member.id);
          }
        }
      }
    });

    return (
      <StatsCarousel className="mb-8">
        {/* Card 1: Monthly Collection */}
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
        {/* Card 2: Monthly Payouts */}
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
        {/* Card 3: Active Members */}
        <StatsCard
          icon={Users}
          label="Active Members"
          value={activeMembers.length}
          subtext={`Total Members: ${members.length}`}
          color="accent"
        />
        {/* Card 4: Collection Count (from CollectionsPage Card 3) */}
        <StatsCard
          icon={CheckCircle2}
          label="Collection Count"
          value={collectedCount}
          subtext={`Total count: ${collectionsThisMonth.length}`}
          color="accent"
        />
      </StatsCarousel>
    );
  }, [members, collectionsData, payoutsData, chitsData, loading]);

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
      <div className="w-full space-y-8">
        {/* Page Header - show skeleton when loading */}
        {loading ? (
          <Skeleton.PageHeader showAction={true} />
        ) : (
          <PageHeader
            title="All Members"
            actionIcon={Printer}
            actionTitle="Print All Members"
            onAction={handlePrintAll}
            isLoading={isPrintingAll}
            showAction={sortedMembers.length > 0}
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
                  "w-1/3",  // Full Name
                  "w-1/4",  // Phone Number
                  "w-24",   // Status
                  "w-32",   // Actions (3 buttons)
                ]}
                serialColumnIndex={0}
                statusColumnIndex={3}
                actionColumnIndex={4}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
                  <MemberCardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Pagination Skeleton */}
            <Skeleton.Pagination />
          </>
        )}

        {/* --- Loaded State: Actual content --- */}
        {/* Overview Metrics */}
        {!loading && members.length > 0 && metricsBlock}

        {/* Unified Search Toolbar - only show when 2+ items */}
        {!loading && members.length >= 2 && (
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
