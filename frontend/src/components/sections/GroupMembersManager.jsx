// frontend/src/components/sections/GroupMembersManager.jsx

import { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import Button from "../ui/Button";
import Table from "../ui/Table";
import ConfirmationModal from "../ui/ConfirmationModal";
import Message from "../ui/Message";
import AssignNewMemberForm from "../forms/AssignNewMemberForm";
import AssignExistingMemberForm from "../forms/AssignExistingMemberForm";
import {
  FiSearch,
  FiUsers,
  FiLoader,
  FiTrash2,
  FiArrowLeft,
  FiUserPlus,
} from "react-icons/fi";
import {
  getAssignmentsForGroup,
  getUnassignedMonths,
  createAssignment,
  deleteAssignment,
} from "../../services/assignmentsService";

const GroupMembersManager = ({ mode, groupId }) => {
  const { token } = useSelector((state) => state.auth);

  const [view, setView] = useState("list"); // 'list', 'new', 'existing'
  const [assignments, setAssignments] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMemberName, setActiveMemberName] = useState(""); // State for the member being assigned

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const assignedMemberIds = useMemo(
    () => assignments.map((a) => a.member.id),
    [assignments]
  );

  const fetchData = async () => {
    if (!groupId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [assignmentsData, monthsData] = await Promise.all([
        getAssignmentsForGroup(groupId, token),
        getUnassignedMonths(groupId, token),
      ]);
      setAssignments(assignmentsData.assignments);
      setAvailableMonths(monthsData.available_months);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [groupId, token]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleAssignment = async (assignmentData) => {
    setLoading(true);
    setError(null);
    try {
      await createAssignment(assignmentData, token);
      setSuccess("Member assigned successfully!");
      setView("list"); // Go back to the list view
      setActiveMemberName(""); // Reset active member name
      fetchData(); // Refresh all data
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
      fetchData(); // Refresh data
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
    setActiveMemberName(""); // Reset name when view changes
  };

  const handleActiveMemberNameChange = (name) => {
    setActiveMemberName(name);
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
    });

  const filteredAssignments = useMemo(() => {
    if (!searchQuery) return assignments;
    const lowercasedQuery = searchQuery.toLowerCase();
    return assignments.filter(
      (a) =>
        a.member.full_name.toLowerCase().includes(lowercasedQuery) ||
        a.member.phone_number.includes(lowercasedQuery)
    );
  }, [assignments, searchQuery]);

  const columns = [
    {
      header: "S.No",
      cell: (row, index) => index + 1,
      className: "text-center",
    },
    {
      header: "Member Name",
      accessor: "member.full_name",
      className: "text-left",
    },
    {
      header: "Phone Number",
      accessor: "member.phone_number",
      className: "text-center",
    },
    {
      header: "Assigned Month",
      cell: (row) => formatDate(row.chit_month),
      className: "text-center",
    },
    ...(mode !== "view"
      ? [
          {
            header: "Actions",
            className: "text-center",
            cell: (row) => (
              <button
                type="button"
                onClick={() => handleDeleteClick(row)}
                className="p-2 text-lg rounded-md text-error-accent hover:bg-error-accent hover:text-white transition-colors duration-200"
              >
                <FiTrash2 />
              </button>
            ),
          },
        ]
      : []),
  ];

  const renderContent = () => {
    if (view === "new") {
      return (
        <AssignNewMemberForm
          token={token}
          groupId={groupId}
          availableMonths={availableMonths}
          onAssignment={handleAssignment}
          formatDate={formatDate}
          onMemberNameChange={handleActiveMemberNameChange} // Pass handler
        />
      );
    }
    if (view === "existing") {
      return (
        <AssignExistingMemberForm
          token={token}
          groupId={groupId}
          availableMonths={availableMonths}
          onAssignment={handleAssignment}
          formatDate={formatDate}
          assignedMemberIds={assignedMemberIds}
          onMemberNameChange={handleActiveMemberNameChange} // Pass handler
        />
      );
    }

    // Default 'list' view
    return (
      <>
        {mode !== "view" && (
          <div className="mb-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => handleViewChange("new")}
                className="w-full sm:w-auto flex items-center justify-center"
              >
                <FiUserPlus className="w-5 h-5 mr-2" />
                <span>Add New Member</span>
              </Button>
              <Button
                onClick={() => handleViewChange("existing")}
                className="w-full sm:w-auto flex items-center justify-center"
              >
                <FiSearch className="mr-2" />
                <span>Add Existing Member</span>
              </Button>
            </div>
          </div>
        )}

        {loading && !assignments.length ? (
          <div className="flex justify-center p-8">
            <FiLoader className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : assignments.length > 0 ? (
          <>
            {assignments.length > 1 && (
              <div className="relative flex items-center mb-4">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <FiSearch className="w-5 h-5 text-text-secondary" />
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
            <Table
              columns={columns}
              data={filteredAssignments}
              variant="secondary"
            />
          </>
        ) : (
          <p className="text-center text-text-secondary py-8">
            No members have been assigned to this group yet.
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
    return "Members";
  };

  const HeaderIcon = view === "list" ? FiUsers : FiUserPlus;

  return (
    <div className="flex-1 flex flex-col">
      <div className="relative flex justify-center items-center mb-2">
        {view !== "list" && (
          <button
            onClick={() => handleViewChange("list")}
            className="absolute left-0 text-text-primary hover:text-accent"
          >
            <FiArrowLeft className="w-6 h-6" />
          </button>
        )}
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <HeaderIcon /> {getHeaderTitle()}
        </h2>
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

export default GroupMembersManager;
