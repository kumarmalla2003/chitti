// frontend/src/features/members/pages/MembersPage.jsx

import { useState, useEffect, useMemo } from "react";
import useScrollToTop from "../../../hooks/useScrollToTop";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMembers, useDeleteMember } from "../hooks/useMembers";
import { getAssignmentsForMember } from "../../../services/assignmentsService";
import { getCollectionsByMemberId } from "../../../services/collectionsService";
import { useSelector } from "react-redux";
import Message from "../../../components/ui/Message";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import Table from "../../../components/ui/Table";
import MemberCard from "../components/cards/MemberCard";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";
import {
  Plus,
  Loader2,
  Search,
  SquarePen,
  Trash2,
  Printer,
  LayoutGrid,
  List,
} from "lucide-react";

import MembersListReportPDF from "../components/reports/MembersListReportPDF";
import MemberReportPDF from "../components/reports/MemberReportPDF";
import { pdf } from "@react-pdf/renderer";

/**
 * MembersPage component - displays a list of all members with search, view toggle, and CRUD operations.
 * Uses React Query for data fetching and caching.
 */
const MembersPage = () => {
  const navigate = useNavigate();
  // isMenuOpen removed (handled by MainLayout)
  const location = useLocation();
  const [success, setSuccess] = useState(null);
  const [localError, setLocalError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { isLoggedIn } = useSelector((state) => state.auth);

  const [viewMode, setViewMode] = useState(() =>
    window.innerWidth < 768 ? "card" : "table"
  );

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

  // Extract members from query data
  const members = membersData?.members ?? [];

  // Combine query error with local error
  const error = localError || (queryError?.message ?? null);

  useScrollToTop(success || error);

  useEffect(() => {
    const handleResize = () => {
      // Optional: Auto-switch view on resize if desired
      // if (window.innerWidth < 768) setViewMode("card");
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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

  const filteredMembers = useMemo(() => {
    if (!searchQuery) return members;
    const lowercasedQuery = searchQuery.toLowerCase();
    return members.filter(
      (member) =>
        member.full_name.toLowerCase().includes(lowercasedQuery) ||
        member.phone_number.includes(lowercasedQuery)
    );
  }, [members, searchQuery]);

  const handlePrintAll = async () => {
    if (filteredMembers.length === 0) return;

    setIsPrintingAll(true);
    try {
      const blob = await pdf(
        <MembersListReportPDF members={filteredMembers} />
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
      cell: (row, index) => index + 1,
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
      header: "Actions",
      accessor: "actions",
      className: "text-center",
      cell: (row) => (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrintMember(row);
            }}
            disabled={printingMemberId === row.id}
            className="p-2 text-lg rounded-md text-info-accent hover:bg-info-accent hover:text-white transition-colors duration-200 cursor-pointer disabled:opacity-50"
            title="Download PDF"
          >
            {printingMemberId === row.id ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Printer className="w-5 h-5" />
            )}
          </button>
          {/* View Button Removed */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/members/edit/${row.id}`);
            }}
            className="p-2 text-lg rounded-md text-warning-accent hover:bg-warning-accent hover:text-white transition-colors duration-200 cursor-pointer"
            title="Edit Member"
          >
            <SquarePen className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(row);
            }}
            className="p-2 text-lg rounded-md text-error-accent hover:bg-error-accent hover:text-white transition-colors duration-200 cursor-pointer"
            title="Delete Member"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="container mx-auto">
        <div className="relative flex justify-center items-center mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary text-center">
            All Members
          </h1>
          {filteredMembers.length > 0 && (
            <div className="absolute right-0 flex items-center">
              <button
                onClick={handlePrintAll}
                disabled={isPrintingAll}
                className="p-2 text-info-accent hover:bg-info-bg rounded-full transition-colors duration-200 disabled:opacity-50"
                title="Print All Members"
              >
                {isPrintingAll ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Printer className="w-6 h-6" />
                )}
              </button>
            </div>
          )}
        </div>

        <hr className="my-4 border-border" />

        {success && <Message type="success">{success}</Message>}
        {error && (
          <Message type="error" onClose={() => setLocalError(null)}>
            {error}
          </Message>
        )}

        {/* --- CONTROLS ROW: Search + View Toggle --- */}
        <div className="mb-6 flex flex-row gap-2 items-stretch justify-between">
          <div className="relative flex-grow md:max-w-md flex items-center">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="w-5 h-5 text-text-secondary" />
            </span>
            <div className="absolute left-10 h-6 w-px bg-border"></div>
            <input
              type="text"
              placeholder="Search by name or phone number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-background-secondary border rounded-md focus:outline-none focus:ring-2 border-border focus:ring-accent"
            />
          </div>

          <div className="flex-shrink-0">
            <button
              onClick={() =>
                setViewMode((prev) =>
                  prev === "table" ? "card" : "table"
                )
              }
              className="h-full px-4 rounded-md bg-background-secondary text-text-secondary hover:bg-background-tertiary transition-all shadow-sm border border-border flex items-center justify-center"
              title={
                viewMode === "table"
                  ? "Switch to Card View"
                  : "Switch to Table View"
              }
            >
              {viewMode === "table" ? (
                <LayoutGrid className="w-5 h-5" />
              ) : (
                <List className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-10 h-10 animate-spin text-accent" />
          </div>
        )}

        {!loading && !error && filteredMembers.length === 0 && (
          <Card className="text-center p-8">
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              {searchQuery ? "No Matching Members" : "No Members Found"}
            </h2>
            <p className="text-text-secondary">
              {searchQuery
                ? "Try a different search term."
                : "You haven't added any members yet. Click the button below to create one!"}
            </p>
          </Card>
        )}

        {!loading && !error && filteredMembers.length > 0 && (
          <>
            {viewMode === "table" ? (
              <div className="overflow-x-auto rounded-lg shadow-sm">
                <Table
                  columns={columns}
                  data={filteredMembers}
                  onRowClick={(row) =>
                    navigate(`/members/view/${row.id}`)
                  }
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMembers.map((member) => (
                  <MemberCard
                    key={member.id}
                    member={member}
                    onView={() => navigate(`/members/view/${member.id}`)}
                    onEdit={() => navigate(`/members/edit/${member.id}`)}
                    onDelete={() => handleDeleteClick(member)}
                    onPrint={handlePrintMember}
                    isPrinting={printingMemberId === member.id}
                  />
                ))}
              </div>
            )}
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
