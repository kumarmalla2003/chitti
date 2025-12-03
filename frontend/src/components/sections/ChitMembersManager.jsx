// frontend/src/components/sections/ChitMembersManager.jsx

import { useState, useEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Button from "../ui/Button";
import Table from "../ui/Table";
import ConfirmationModal from "../ui/ConfirmationModal";
import Message from "../ui/Message";
import AssignNewMemberForm from "../forms/AssignNewMemberForm";
import AssignExistingMemberForm from "../forms/AssignExistingMemberForm";
import RapidAssignForm from "../forms/RapidAssignForm";
import AssignedMemberCard from "../ui/AssignedMemberCard";
import StatusBadge from "../ui/StatusBadge";
import {
  Search,
  Users,
  Loader2,
  Trash2,
  ArrowLeft,
  UserPlus,
  FastForward,
  ArrowRight,
  IndianRupee,
} from "lucide-react";
import {
  getAssignmentsForChit,
  getUnassignedMonths,
  createAssignment,
  deleteAssignment,
} from "../../services/assignmentsService";

const ITEMS_PER_PAGE = 10;

const ChitMembersManager = ({
  mode,
  chitId,
  onLogCollectionClick,
  forceTable = false,
}) => {
  const { token } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [view, setView] = useState("list");
  const [assignments, setAssignments] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMemberName, setActiveMemberName] = useState("");

  // --- NEW: Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const formRef = useRef(null);

  const assignedMemberIds = useMemo(
    () => assignments.map((a) => a.member.id),
    [assignments]
  );

  const fetchData = async () => {
    if (!chitId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [assignmentsData, monthsData] = await Promise.all([
        getAssignmentsForChit(chitId, token),
        getUnassignedMonths(chitId, token),
      ]);
      setAssignments(assignmentsData.assignments);
      setAvailableMonths(monthsData.available_months);
      setCurrentPage(1); // Reset pagination
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [chitId, token]);

  // Reset pagination when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleAddMemberClick = () => {
    if (mode === "view") {
      navigate(`/chits/edit/${chitId}`, { state: { initialTab: "members" } });
    }
  };

  const handleAssignment = async (assignmentData) => {
    setLoading(true);
    setError(null);
    try {
      await createAssignment(assignmentData, token);
      setSuccess("Member assigned successfully!");
      setView("list");
      setActiveMemberName("");
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (assignment) => {
    setItemToDelete(assignment);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleteLoading(true);
    setError(null);
    try {
      await deleteAssignment(itemToDelete.id, token);
      setSuccess(`"${itemToDelete.member.full_name}" has been unassigned.`);
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleteLoading(false);
      setIsModalOpen(false);
      setItemToDelete(null);
    }
  };

  const handleViewChange = (newView) => {
    setView(newView);
    setActiveMemberName("");
  };

  const handleBackNavigation = () => {
    if (formRef.current && typeof formRef.current.goBack === "function") {
      formRef.current.goBack();
    } else {
      handleViewChange("list");
    }
  };

  const handleActiveMemberNameChange = (name) => {
    setActiveMemberName(name);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${year}`;
  };

  const filteredAssignments = useMemo(() => {
    if (!searchQuery) return assignments;
    const lowercasedQuery = searchQuery.toLowerCase();
    return assignments.filter(
      (a) =>
        a.member.full_name.toLowerCase().includes(lowercasedQuery) ||
        a.member.phone_number.includes(lowercasedQuery)
    );
  }, [assignments, searchQuery]);

  // --- PAGINATION LOGIC ---
  const totalPages = Math.ceil(filteredAssignments.length / ITEMS_PER_PAGE);
  const paginatedAssignments =
    mode === "view"
      ? filteredAssignments.slice(
          (currentPage - 1) * ITEMS_PER_PAGE,
          currentPage * ITEMS_PER_PAGE
        )
      : filteredAssignments;

  const columns = [
    {
      header: "S.No",
      cell: (row, index) =>
        (mode === "view" ? (currentPage - 1) * ITEMS_PER_PAGE : 0) + index + 1,
      className: "text-center",
    },
    {
      header: "Member Name",
      accessor: "member.full_name",
      className: "text-center",
    },
    {
      header: "Assigned Month",
      cell: (row) => (
        <div className="text-center w-full">{formatDate(row.chit_month)}</div>
      ),
      className: "text-center",
    },
    {
      header: "Due",
      accessor: "due_amount",
      className: "text-center",
      cell: (row) => (
        <span
          className={
            row.due_amount > 0 ? "text-error-accent" : "text-text-secondary"
          }
        >
          ₹{row.due_amount.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "collection_status",
      className: "text-center",
      cell: (row) => <StatusBadge status={row.collection_status} />,
    },
    ...(mode !== "view"
      ? [
          {
            header: "Actions",
            className: "text-center",
            cell: (row) => (
              <div className="flex items-center justify-center space-x-2">
                <button
                  type="button"
                  onClick={() => onLogCollectionClick(row)}
                  className="p-2 text-lg rounded-md text-success-accent hover:bg-success-accent hover:text-white transition-colors duration-200"
                  title="Log Collection"
                >
                  <IndianRupee className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteClick(row)}
                  className="p-2 text-lg rounded-md text-error-accent hover:bg-error-accent hover:text-white transition-colors duration-200"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ),
          },
        ]
      : []),
  ];

  const renderContent = () => {
    if (view === "new") {
      return (
        <AssignNewMemberForm
          ref={formRef}
          token={token}
          chitId={chitId}
          availableMonths={availableMonths}
          onAssignment={handleAssignment}
          formatDate={formatDate}
          onMemberNameChange={handleActiveMemberNameChange}
          onBackToList={() => handleViewChange("list")}
        />
      );
    }
    if (view === "existing") {
      return (
        <AssignExistingMemberForm
          ref={formRef}
          token={token}
          chitId={chitId}
          availableMonths={availableMonths}
          onAssignment={handleAssignment}
          formatDate={formatDate}
          assignedMemberIds={assignedMemberIds}
          onMemberNameChange={handleActiveMemberNameChange}
          onBackToList={() => handleViewChange("list")}
        />
      );
    }
    if (view === "rapid") {
      return (
        <RapidAssignForm
          ref={formRef}
          token={token}
          chitId={chitId}
          formatDate={formatDate}
          onAssignmentSuccess={() => {
            setSuccess("Members assigned successfully!");
            setView("list");
            setActiveMemberName("");
            fetchData();
          }}
          onBackToList={() => handleViewChange("list")}
        />
      );
    }

    return (
      <>
        {mode !== "view" && (
          <div className="mb-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => handleViewChange("rapid")}
                className="w-full sm:w-auto flex items-center justify-center"
              >
                <FastForward className="w-5 h-5 mr-2" />
                <span>Rapid Assign</span>
              </Button>
              <Button
                onClick={() => handleViewChange("new")}
                className="w-full sm:w-auto flex items-center justify-center"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                <span>Add New Member</span>
              </Button>
              <Button
                onClick={() => handleViewChange("existing")}
                className="w-full sm:w-auto flex items-center justify-center"
              >
                <Search className=" w-5 h-5 mr-2" />
                <span>Add Existing Member</span>
              </Button>
            </div>
          </div>
        )}

        {loading && !assignments.length ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : assignments.length > 0 ? (
          <>
            {assignments.length > 1 && (
              <div className="relative flex items-center mb-4">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="w-5 h-5 text-text-secondary" />
                </span>
                <div className="absolute left-10 h-6 w-px bg-border"></div>
                <input
                  type="text"
                  placeholder="Search assigned members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-background-secondary border rounded-md focus:outline-none focus:ring-2 border-border focus:ring-accent"
                />
              </div>
            )}

            <div
              className={
                forceTable ? "block overflow-x-auto" : "hidden md:block"
              }
            >
              {/* --- MODIFIED: Standard Table using paginated data --- */}
              <Table
                columns={columns}
                data={paginatedAssignments}
                variant="secondary"
              />

              {/* --- NEW: Pagination Controls (No Background, Arrows at Ends) --- */}
              {mode === "view" && totalPages > 1 && (
                <div className="flex justify-between items-center mt-4 w-full px-2 text-sm text-text-secondary">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-full hover:bg-background-secondary hover:text-text-primary disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <span className="font-medium">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-full hover:bg-background-secondary hover:text-text-primary disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {!forceTable && (
              <div className="block md:hidden space-y-4">
                {paginatedAssignments.map((assignment) => (
                  <AssignedMemberCard
                    key={assignment.id}
                    assignment={assignment}
                    onDelete={() => handleDeleteClick(assignment)}
                    onLogCollection={onLogCollectionClick}
                  />
                ))}
                {/* Mobile Pagination would go here if needed, but 'View All' usually better for mobile lists */}
              </div>
            )}
          </>
        ) : (
          <p className="text-center text-text-secondary py-8">
            No members have been assigned to this chit yet.
          </p>
        )}
      </>
    );
  };

  const getHeaderTitle = () => {
    if (activeMemberName) {
      return `${activeMemberName}`;
    }
    if (view === "new") return "Add New Member";
    if (view === "existing") return "Add Existing Member";
    if (view === "rapid") return "Rapid Assignment";
    return "Members";
  };

  const HeaderIcon =
    view === "list" ? Users : view === "rapid" ? FastForward : UserPlus;

  return (
    <div className="flex-1 flex flex-col">
      <div className="relative flex justify-center items-center mb-2">
        {view !== "list" && (
          <button
            onClick={handleBackNavigation}
            className="absolute left-0 text-text-primary hover:text-accent"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <HeaderIcon className="w-6 h-6" /> {getHeaderTitle()}
        </h2>
        {mode === "view" && view === "list" && (
          <button
            onClick={handleAddMemberClick}
            className="absolute right-0 p-1 text-success-accent hover:bg-success-bg rounded-full transition-colors duration-200 print:hidden"
            title="Add Member"
          >
            <UserPlus className="w-5 h-5" />
          </button>
        )}
      </div>
      <hr className="border-border mb-4" />

      {success && <Message type="success">{success}</Message>}
      {error && (
        <Message type="error" onClose={() => setError(null)}>
          {error}
        </Message>
      )}

      {renderContent()}

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Unassign Member?"
        message={`Are you sure you want to unassign "${itemToDelete?.member.full_name}"? Their assigned month will become available again.`}
        confirmText="Unassign"
        loading={deleteLoading}
      />
    </div>
  );
};

export default ChitMembersManager;
