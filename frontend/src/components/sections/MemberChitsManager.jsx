// frontend/src/components/sections/MemberChitsManager.jsx

import { useState, useEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
// import { useNavigate } from "react-router-dom"; // <-- REMOVED
import Button from "../ui/Button";
import Card from "../ui/Card";
import Table from "../ui/Table";
import ConfirmationModal from "../ui/ConfirmationModal";
import Message from "../ui/Message";
import AssignNewGroupForm from "../forms/AssignNewGroupForm";
import AssignExistingGroupForm from "../forms/AssignExistingGroupForm";
import StatusBadge from "../ui/StatusBadge";
import AssignedGroupCard from "../ui/AssignedGroupCard";
import {
  FiSearch,
  FiBox,
  FiLoader,
  FiTrash2,
  FiArrowLeft,
  FiPlus,
} from "react-icons/fi";
import { RupeeIcon } from "../ui/Icons";
import {
  getAssignmentsForMember,
  createAssignment,
  deleteAssignment,
} from "../../services/assignmentsService";

const MemberChitsManager = ({ mode, memberId, onLogPaymentClick }) => {
  // <-- Prop added
  const { token } = useSelector((state) => state.auth);
  // const navigate = useNavigate(); // <-- REMOVED

  const [view, setView] = useState("list");
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeGroupName, setActiveGroupName] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const formRef = useRef(null);

  const fetchData = async () => {
    if (!memberId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const assignmentsData = await getAssignmentsForMember(memberId, token);
      setAssignments(assignmentsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (memberId) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [memberId, token]);

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
      setView("list");
      setActiveGroupName("");
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
      setSuccess(
        `Assignment in "${itemToDelete.chit_group.name}" for ${formatDate(
          itemToDelete.chit_month
        )} has been removed.`
      );
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
    setActiveGroupName("");
    setError(null);
    setSuccess(null);
  };

  const handleBackNavigation = () => {
    if (formRef.current && typeof formRef.current.goBack === "function") {
      formRef.current.goBack();
    } else {
      handleViewChange("list");
    }
  };

  const handleActiveGroupNameChange = (name) => {
    setActiveGroupName(name);
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
    });

  const filteredAssignments = useMemo(() => {
    if (!searchQuery) return assignments;
    const lowercasedQuery = searchQuery.toLowerCase();
    return assignments.filter((a) =>
      a.chit_group.name.toLowerCase().includes(lowercasedQuery)
    );
  }, [assignments, searchQuery]);

  const columns = [
    {
      header: "S.No",
      cell: (row, index) => index + 1,
      className: "text-center",
    },
    {
      header: "Group Name",
      accessor: "chit_group.name",
      className: "text-left",
    },
    {
      header: "Assigned Month",
      cell: (row) => formatDate(row.chit_month),
      className: "text-center",
    },
    {
      header: "Group Status",
      accessor: "chit_group.status",
      cell: (row) => <StatusBadge status={row.chit_group.status} />,
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
      header: "Payment Status",
      accessor: "payment_status",
      className: "text-center",
      cell: (row) => <StatusBadge status={row.payment_status} />,
    },
    ...(mode !== "view"
      ? [
          {
            header: "Actions",
            className: "text-center",
            cell: (row) => (
              <div className="flex items-center justify-center space-x-2">
                {/* --- MODIFIED THIS BUTTON --- */}
                <button
                  type="button"
                  onClick={() => onLogPaymentClick(row)}
                  className="p-2 text-lg rounded-md text-success-accent hover:bg-success-accent hover:text-white transition-colors duration-200"
                  title="Log Payment"
                >
                  <RupeeIcon className="w-5 h-5" />
                </button>
                {/* --- END OF MODIFICATION --- */}
                <button
                  type="button"
                  onClick={() => handleDeleteClick(row)}
                  className="p-2 text-lg rounded-md text-error-accent hover:bg-error-accent hover:text-white transition-colors duration-200"
                >
                  <FiTrash2 />
                </button>
              </div>
            ),
          },
        ]
      : []),
  ];

  const renderContent = () => {
    if (!memberId && mode === "create") {
      return (
        <p className="text-center text-text-secondary py-8">
          Please save the member's details first to enable chit assignments.
        </p>
      );
    }

    if (view === "new") {
      return (
        <AssignNewGroupForm
          ref={formRef}
          token={token}
          memberId={memberId}
          onAssignment={handleAssignment}
          formatDate={formatDate}
          onGroupNameChange={handleActiveGroupNameChange}
          onBackToList={() => handleViewChange("list")}
        />
      );
    }
    if (view === "existing") {
      return (
        <AssignExistingGroupForm
          ref={formRef}
          token={token}
          memberId={memberId}
          onAssignment={handleAssignment}
          formatDate={formatDate}
          existingAssignments={assignments}
          onGroupNameChange={handleActiveGroupNameChange}
          onBackToList={() => handleViewChange("list")}
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
                <FiPlus className="w-5 h-5 mr-2" />
                <span>Assign to New Group</span>
              </Button>
              <Button
                onClick={() => handleViewChange("existing")}
                className="w-full sm:w-auto flex items-center justify-center"
              >
                <FiSearch className="mr-2" />
                <span>Assign to Existing Group</span>
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
                  placeholder="Search assigned groups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-background-secondary border rounded-md focus:outline-none focus:ring-2 border-border focus:ring-accent"
                />
              </div>
            )}
            <div className="hidden md:block">
              <Table
                columns={columns}
                data={filteredAssignments}
                variant="secondary"
              />
            </div>
            <div className="block md:hidden space-y-4">
              {filteredAssignments.map((assignment) => (
                <AssignedGroupCard
                  key={assignment.id}
                  assignment={assignment}
                  onDelete={() => handleDeleteClick(assignment)}
                  onLogPayment={onLogPaymentClick} // <-- Prop added
                />
              ))}
            </div>
          </>
        ) : (
          <p className="text-center text-text-secondary py-8">
            This member has no active assignments.
          </p>
        )}
      </>
    );
  };

  const getHeaderTitle = () => {
    if (activeGroupName) {
      return `${activeGroupName}`;
    }
    if (view === "new") return "Assign to New Group";
    if (view === "existing") return "Assign to Existing Group";
    return "Chits";
  };

  return (
    <Card className="flex-1 flex flex-col">
      <div className="relative flex justify-center items-center mb-2">
        {view !== "list" && (
          <button
            onClick={handleBackNavigation}
            className="absolute left-0 text-text-primary hover:text-accent"
          >
            <FiArrowLeft className="w-6 h-6" />
          </button>
        )}
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <FiBox /> {getHeaderTitle()}
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
        title="Remove Assignment?"
        message={`Are you sure you want to remove this member from "${
          itemToDelete?.chit_group.name
        }" for ${
          itemToDelete ? formatDate(itemToDelete.chit_month) : ""
        }? This month will become available again.`}
        confirmText="Remove"
        loading={deleteLoading}
      />
    </Card>
  );
};

export default MemberChitsManager;
