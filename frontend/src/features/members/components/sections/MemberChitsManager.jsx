// frontend/src/features/members/components/sections/MemberChitsManager.jsx

import { useState, useEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import Button from "../../../../components/ui/Button";
import Card from "../../../../components/ui/Card";
import Table from "../../../../components/ui/Table";
import ConfirmationModal from "../../../../components/ui/ConfirmationModal";
import Message from "../../../../components/ui/Message";
import AssignNewChitForm from "../../../chits/components/forms/AssignNewChitForm";
import AssignExistingChitForm from "../../../chits/components/forms/AssignExistingChitForm";
import StatusBadge from "../../../../components/ui/StatusBadge";
import AssignedChitCard from "../../../chits/components/cards/AssignedChitCard";
import {
  Search,
  Layers,
  Loader2,
  Trash2,
  ArrowLeft,
  Plus,
  SquarePen,
  IndianRupee,
} from "lucide-react";
import {
  getAssignmentsForMember,
  createAssignment,
  deleteAssignment,
} from "../../../../services/assignmentsService";

const MemberChitsManager = ({
  mode,
  memberId,
  onLogCollectionClick,
  forceTable = false,
  onManage, // <-- Prop
}) => {
  const [view, setView] = useState("list");
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChitName, setActiveChitName] = useState("");

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
      const assignmentsData = await getAssignmentsForMember(memberId);
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
  }, [memberId]);

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
      await createAssignment(assignmentData);
      setSuccess("Member assigned successfully!");
      setView("list");
      setActiveChitName("");
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
      await deleteAssignment(itemToDelete.id);
      setSuccess(
        `Assignment in "${itemToDelete.chit.name}" for ${formatDate(
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
    setActiveChitName("");
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

  const handleActiveChitNameChange = (name) => {
    setActiveChitName(name);
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
      a.chit.name.toLowerCase().includes(lowercasedQuery)
    );
  }, [assignments, searchQuery]);

  const columns = [
    {
      header: "S.No",
      cell: (row, index) => index + 1,
      className: "text-center",
    },
    {
      header: "Chit Name",
      accessor: "chit.name",
      className: "text-left",
    },
    {
      header: "Assigned Month",
      cell: (row) => formatDate(row.chit_month),
      className: "text-center",
    },
    {
      header: "Chit Status",
      accessor: "chit.status",
      cell: (row) => <StatusBadge status={row.chit.status} />,
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
      header: "Collection Status",
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
    if (!memberId && mode === "create") {
      return (
        <p className="text-center text-text-secondary py-8">
          Please save the member's details first to enable chit assignments.
        </p>
      );
    }

    if (view === "new") {
      return (
        <AssignNewChitForm
          ref={formRef}
          memberId={memberId}
          onAssignment={handleAssignment}
          formatDate={formatDate}
          onChitNameChange={handleActiveChitNameChange}
          onBackToList={() => handleViewChange("list")}
        />
      );
    }
    if (view === "existing") {
      return (
        <AssignExistingChitForm
          ref={formRef}
          memberId={memberId}
          onAssignment={handleAssignment}
          formatDate={formatDate}
          existingAssignments={assignments}
          onChitNameChange={handleActiveChitNameChange}
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
                onClick={() => handleViewChange("new")}
                className="w-full sm:w-auto flex items-center justify-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                <span>Assign to New Chit</span>
              </Button>
              <Button
                onClick={() => handleViewChange("existing")}
                className="w-full sm:w-auto flex items-center justify-center"
              >
                <Search className="w-5 h-5 mr-2" />
                <span>Assign to Existing Chit</span>
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
                  placeholder="Search assigned chits..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-background-secondary border rounded-md focus:outline-none focus:ring-2 border-border focus:ring-accent"
                />
              </div>
            )}

            <div
              className={
                forceTable
                  ? "block overflow-x-auto"
                  : "hidden md:block overflow-x-auto"
              }
            >
              <Table
                columns={columns}
                data={filteredAssignments}
                variant="secondary"
              />
            </div>

            {!forceTable && (
              <div className="block md:hidden space-y-4">
                {filteredAssignments.map((assignment) => (
                  <AssignedChitCard
                    key={assignment.id}
                    assignment={assignment}
                    onDelete={() => handleDeleteClick(assignment)}
                    onLogCollection={onLogCollectionClick}
                  />
                ))}
              </div>
            )}
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
    if (activeChitName) {
      return `${activeChitName}`;
    }
    if (view === "new") return "Assign to New Chit";
    if (view === "existing") return "Assign to Existing Chit";
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
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <Layers className="w-6 h-6" /> {getHeaderTitle()}
        </h2>

        {/* --- UPDATE: Changed Edit to Assign (Plus) Icon --- */}
        {mode === "view" && view === "list" && onManage && (
          <button
            onClick={onManage}
            className="absolute right-0 p-1 text-success-accent hover:bg-success-bg rounded-full transition-colors duration-200 print:hidden"
            title="Assign Chit"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
        {/* --- END UPDATE --- */}
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
        message={`Are you sure you want to remove this member from "${itemToDelete?.chit.name
          }" for ${itemToDelete ? formatDate(itemToDelete.chit_month) : ""
          }? This month will become available again.`}
        confirmText="Remove"
        loading={deleteLoading}
      />
    </Card>
  );
};

export default MemberChitsManager;
