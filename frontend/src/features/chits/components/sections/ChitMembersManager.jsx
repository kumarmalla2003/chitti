// frontend/src/features/chits/components/sections/ChitMembersManager.jsx

import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import Button from "../../../../components/ui/Button";
import Table from "../../../../components/ui/Table";
import ConfirmationModal from "../../../../components/ui/ConfirmationModal";
import Message from "../../../../components/ui/Message";
import AssignNewMemberForm from "../../../members/components/forms/AssignNewMemberForm";
import AssignExistingMemberForm from "../../../members/components/forms/AssignExistingMemberForm";
import RapidAssignForm from "../forms/RapidAssignForm";
import AssignedMemberCard from "../../../members/components/cards/AssignedMemberCard";
import StatusBadge from "../../../../components/ui/StatusBadge";
import {
  Search,
  Users,
  Loader2,
  Trash2,
  ArrowLeft,
  ArrowRight,
  UserPlus,
  FastForward,
  IndianRupee,
  LayoutGrid,
  List,
  HandCoins,
} from "lucide-react";
import {
  useAssignmentsByChit,
  useUnassignedMonths,
  useCreateAssignment,
  useDeleteAssignment,
  assignmentKeys,
} from "../../../assignments/hooks/useAssignments";
import { useChitDetails } from "../../hooks/useChits";
import { usePayoutsByChit } from "../../../payouts/hooks/usePayouts";
import { useCollectionsByChit, collectionKeys } from "../../../collections/hooks/useCollections";
import { createAssignment } from "../../../../services/assignmentsService";

const ITEMS_PER_PAGE = 10;

const formatAmount = (value) => {
  if (value === 0) return "0";
  if (!value) return "-";
  return parseInt(value).toLocaleString("en-IN");
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const calculateMonthDate = (startDateStr, monthIndex) => {
  if (!startDateStr) return "-";
  const d = new Date(startDateStr);
  d.setMonth(d.getMonth() + (monthIndex - 1));
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  return `${month}/${year}`;
};

/**
 * ChitMembersManager component - manages member assignments for a chit.
 * Uses React Query for data fetching and caching.
 */
const ChitMembersManager = ({ mode, chitId, onLogCollectionClick }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [view, setView] = useState("list");
  const [layoutMode, setLayoutMode] = useState("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMemberName, setActiveMemberName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [success, setSuccess] = useState(null);
  const [localError, setLocalError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const formRef = useRef(null);

  // React Query hooks
  const {
    data: assignmentsResponse,
    isLoading: assignmentsLoading,
    error: assignmentsError,
    refetch: refetchAssignments,
  } = useAssignmentsByChit(chitId);

  const {
    data: monthsResponse,
    refetch: refetchMonths,
  } = useUnassignedMonths(chitId);

  const {
    data: chitData,
    isLoading: chitLoading,
  } = useChitDetails(chitId);

  const {
    data: payoutsResponse,
    isLoading: payoutsLoading,
  } = usePayoutsByChit(chitId);

  const {
    data: collectionsResponse,
    isLoading: collectionsLoading,
  } = useCollectionsByChit(chitId);

  const deleteAssignmentMutation = useDeleteAssignment();

  // Extract data from responses
  const assignments = assignmentsResponse?.assignments ?? [];
  const availableMonths = monthsResponse?.available_months ?? [];
  const chitDetails = chitData ?? null;
  const payouts = payoutsResponse?.payouts ?? [];
  const collections = collectionsResponse?.collections ?? [];

  const loading = assignmentsLoading || chitLoading || payoutsLoading || collectionsLoading;
  const error = localError || (assignmentsError?.message ?? null);

  const assignedMemberIds = useMemo(
    () => assignments.map((a) => a.member.id),
    [assignments]
  );

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
    setLocalError(null);
    try {
      await createAssignment(assignmentData);
      setSuccess("Member assigned successfully!");
      setView("list");
      setActiveMemberName("");
      // Invalidate and refetch
      await Promise.all([
        refetchAssignments(),
        refetchMonths(),
        queryClient.invalidateQueries({ queryKey: collectionKeys.byChit(chitId) }),
      ]);
    } catch (err) {
      setLocalError(err.message);
    }
  };

  const handleDeleteClick = (assignment) => {
    setItemToDelete(assignment);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setLocalError(null);

    deleteAssignmentMutation.mutate(itemToDelete.id, {
      onSuccess: () => {
        setSuccess(`"${itemToDelete.member.full_name}" has been unassigned.`);
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

  const handlePayoutClick = (payoutId) => {
    navigate(`/payouts/view/${payoutId}`);
  };

  // --- DATA PROCESSING ---
  const allMonthsData = useMemo(() => {
    if (!chitDetails) return [];

    const totalMonths = chitDetails.duration_months;
    const rows = [];

    for (let i = 1; i <= totalMonths; i++) {
      const expectedDateStr = calculateMonthDate(chitDetails.start_date, i);

      const assignment = assignments.find((a) => {
        const d = new Date(a.chit_month);
        const m = (d.getMonth() + 1).toString().padStart(2, "0");
        const y = d.getFullYear();
        return `${m}/${y}` === expectedDateStr;
      });

      const payout = payouts.find((p) => p.month === i);

      let collectedAmount = 0;
      let lastCollectionDate = null;

      if (assignment) {
        const assignmentCollections = collections.filter(
          (c) => c.chit_assignment_id === assignment.id
        );
        collectedAmount = assignmentCollections.reduce(
          (sum, c) => sum + c.amount_paid,
          0
        );
        if (assignmentCollections.length > 0) {
          const dates = assignmentCollections.map(
            (c) => new Date(c.collection_date)
          );
          const maxDate = new Date(Math.max(...dates));
          lastCollectionDate = maxDate.toISOString();
        }
      }

      rows.push({
        monthIndex: i,
        monthLabel: expectedDateStr,
        assignment: assignment || null,
        payout: payout || null,
        collectedAmount,
        lastCollectionDate,
      });
    }
    return rows;
  }, [chitDetails, assignments, payouts, collections]);

  const filteredData = useMemo(() => {
    if (!searchQuery) return allMonthsData;
    const lowerQuery = searchQuery.toLowerCase();
    return allMonthsData.filter((row) => {
      const memberName = row.assignment?.member.full_name.toLowerCase() || "";
      const monthStr = row.monthLabel;
      return memberName.includes(lowerQuery) || monthStr.includes(lowerQuery);
    });
  }, [allMonthsData, searchQuery]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData =
    mode === "view"
      ? filteredData.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
      )
      : filteredData;

  const columns = [
    {
      header: "S.No",
      cell: (row, index) =>
        (mode === "view" ? (currentPage - 1) * ITEMS_PER_PAGE : 0) + index + 1,
      className: "text-center",
      headerClassName: "text-center w-12",
    },
    {
      header: "Month",
      accessor: "monthLabel",
      className: "text-center font-medium",
      headerClassName: "text-center",
    },
    {
      header: "Member",
      className: "text-center",
      headerClassName: "text-center",
      cell: (row) =>
        row.assignment ? (
          <span className="font-medium text-text-primary">
            {row.assignment.member.full_name}
          </span>
        ) : (
          <span className="text-text-secondary italic">-</span>
        ),
    },
    {
      header: "Monthly Payable",
      className: "text-center",
      headerClassName: "text-center",
      cell: () => (
        <span className="text-text-primary">
          ₹{formatAmount(chitDetails?.monthly_installment)}
        </span>
      ),
    },
    // --- Collection Columns ---
    {
      header: "Collected",
      className: "text-center",
      headerClassName: "text-center",
      cell: (row) => (
        <span
          className={
            row.collectedAmount > 0
              ? "text-success-accent font-medium"
              : "text-text-secondary"
          }
        >
          {row.collectedAmount > 0
            ? `₹${formatAmount(row.collectedAmount)}`
            : "-"}
        </span>
      ),
    },
    {
      header: "Collected On",
      className: "text-center text-sm",
      headerClassName: "text-center",
      cell: (row) =>
        row.lastCollectionDate ? (
          <span>{formatDate(row.lastCollectionDate)}</span>
        ) : (
          <span className="text-text-secondary">-</span>
        ),
    },
    // --- Payout Columns (Split) ---
    {
      header: "Payout Plan",
      className: "text-center",
      headerClassName: "text-center",
      cell: (row) => (
        <span className="text-text-primary">
          {row.payout ? `₹${formatAmount(row.payout.planned_amount)}` : "-"}
        </span>
      ),
    },
    {
      header: "Payout Paid",
      className: "text-center",
      headerClassName: "text-center",
      cell: (row) => (
        <span
          className={
            row.payout?.amount > 0
              ? "text-warning-accent font-medium"
              : "text-text-secondary"
          }
        >
          {row.payout?.amount > 0 ? `₹${formatAmount(row.payout.amount)}` : "-"}
        </span>
      ),
    },
    {
      header: "Payout Date",
      className: "text-center text-sm",
      headerClassName: "text-center",
      cell: (row) =>
        row.payout && row.payout.paid_date ? (
          <span>{formatDate(row.payout.paid_date)}</span>
        ) : (
          <span className="text-text-secondary">-</span>
        ),
    },
    ...(mode !== "view"
      ? [
        {
          header: "Actions",
          className: "text-center",
          headerClassName: "text-center",
          cell: (row) => (
            <div className="flex items-center justify-center space-x-2">
              {row.assignment && (
                <>
                  <button
                    type="button"
                    onClick={() => onLogCollectionClick(row.assignment)}
                    className="p-2 text-lg rounded-md text-success-accent hover:bg-success-accent hover:text-white transition-colors duration-200"
                    title="Log Collection"
                  >
                    <IndianRupee className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(row.assignment)}
                    className="p-2 text-lg rounded-md text-error-accent hover:bg-error-accent hover:text-white transition-colors duration-200"
                    title="Unassign"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </>
              )}
              {row.payout && (
                <button
                  type="button"
                  onClick={() => handlePayoutClick(row.payout.id)}
                  className="p-2 text-lg rounded-md text-warning-accent hover:bg-warning-accent hover:text-white transition-colors duration-200"
                  title="View/Record Payout"
                >
                  <HandCoins className="w-5 h-5" />
                </button>
              )}
            </div>
          ),
        },
      ]
      : []),
  ];

  const handleRapidAssignSuccess = async () => {
    setSuccess("Members assigned successfully!");
    setView("list");
    setActiveMemberName("");
    await Promise.all([
      refetchAssignments(),
      refetchMonths(),
      queryClient.invalidateQueries({ queryKey: collectionKeys.byChit(chitId) }),
    ]);
  };

  const renderContent = () => {
    if (view === "new") {
      return (
        <AssignNewMemberForm
          ref={formRef}
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
          chitId={chitId}
          formatDate={formatDate}
          onAssignmentSuccess={handleRapidAssignSuccess}
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

        {loading && !allMonthsData.length ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : (
          <>
            <div className="relative flex items-center mb-4">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="w-5 h-5 text-text-secondary" />
              </span>
              <div className="absolute left-10 h-6 w-px bg-border"></div>
              <input
                type="text"
                placeholder="Search by member..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-background-secondary border rounded-md focus:outline-none focus:ring-2 border-border focus:ring-accent"
              />
            </div>

            {layoutMode === "table" ? (
              <div className="block overflow-x-auto">
                <Table
                  columns={columns}
                  data={paginatedData}
                  variant="secondary"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedData.map((row, index) =>
                  row.assignment ? (
                    <AssignedMemberCard
                      key={row.assignment.id}
                      assignment={row.assignment}
                      centered={mode === "view"}
                      onDelete={
                        mode !== "view"
                          ? () => handleDeleteClick(row.assignment)
                          : null
                      }
                      onLogCollection={
                        mode !== "view" ? onLogCollectionClick : null
                      }
                    />
                  ) : (
                    <div
                      key={`empty-${index}`}
                      className="p-4 rounded-lg bg-background-secondary border border-dashed border-border flex items-center justify-center text-text-secondary"
                    >
                      <span className="text-sm">
                        {row.monthLabel} - Unassigned
                      </span>
                    </div>
                  )
                )}
              </div>
            )}

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
          </>
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
        <Message type="error" onClose={() => setLocalError(null)}>
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
        loading={deleteAssignmentMutation.isPending}
      />
    </div>
  );
};

export default ChitMembersManager;
