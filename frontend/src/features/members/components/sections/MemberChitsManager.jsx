// frontend/src/features/members/components/sections/MemberChitsManager.jsx

import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../../components/ui/Button";
import Card from "../../../../components/ui/Card";
import Table from "../../../../components/ui/Table";
import ConfirmationModal from "../../../../components/ui/ConfirmationModal";
import Message from "../../../../components/ui/Message";
import StatusBadge from "../../../../components/ui/StatusBadge";
import Skeleton from "../../../../components/ui/Skeleton";
import AssignNewChitForm from "../../../chits/components/forms/AssignNewChitForm";
import AssignExistingChitForm from "../../../chits/components/forms/AssignExistingChitForm";
import {
  Search,
  ClipboardList,
  Loader2,
  Trash2,
  ArrowLeft,
  Plus,
  IndianRupee,
  ChevronDown,
  ChevronUp,
  UserPlus,
} from "lucide-react";
import {
  getAssignmentsForMember,
  createAssignment,
  deleteAssignment,
} from "../../../../services/assignmentsService";

/**
 * MemberChitsManager (Assignments Section)
 * Redesigned with chit-centric layout matching ChitDetailPage's AssignmentsSection.
 * Shows chits as expandable rows with assigned months inside.
 */
const MemberChitsManager = ({
  mode,
  memberId,
  onLogCollectionClick,
  forceTable = false,
  onManage,
}) => {
  const navigate = useNavigate();
  const formRef = useRef(null);

  // --- State ---
  const [view, setView] = useState("list");
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedChitId, setExpandedChitId] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [activeChitName, setActiveChitName] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // --- Fetch Data ---
  const fetchData = async () => {
    if (!memberId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await getAssignmentsForMember(memberId);
      // API returns { slots: [...] }, extract the array
      setAssignments(response?.slots || response || []);
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

  // --- Group Assignments by Chit ---
  const groupedByChit = useMemo(() => {
    const grouped = {};
    // Safety check: ensure assignments is an array
    const assignmentsList = Array.isArray(assignments) ? assignments : [];
    assignmentsList.forEach((assignment) => {
      // Skip if assignment doesn't have chit data
      if (!assignment?.chit?.id) return;

      const chitId = assignment.chit.id;
      if (!grouped[chitId]) {
        grouped[chitId] = {
          chit: assignment.chit,
          months: [],
          totalDue: 0,
        };
      }
      grouped[chitId].months.push(assignment);
      grouped[chitId].totalDue += assignment.due_amount || 0;
    });
    return Object.values(grouped);
  }, [assignments]);

  // --- Filter & Search ---
  const filteredData = useMemo(() => {
    let data = groupedByChit;

    // Status filter
    if (statusFilter === "active") {
      data = data.filter((g) => g.chit.status === "Active");
    } else if (statusFilter === "completed") {
      data = data.filter((g) => g.chit.status !== "Active");
    } else if (statusFilter === "due") {
      data = data.filter((g) => g.totalDue > 0);
    } else if (statusFilter === "paid") {
      data = data.filter((g) => g.totalDue === 0);
    }

    // Search
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      data = data.filter((g) =>
        g.chit.name.toLowerCase().includes(lowerQuery)
      );
    }

    return data;
  }, [groupedByChit, statusFilter, searchQuery]);

  // --- Handlers ---
  const handleViewChange = (newView) => {
    setView(newView);
    setError(null);
    setSuccess(null);
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
        `Assignment for ${formatDate(itemToDelete.chit_month)} removed.`
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

  const handleAssignment = async (assignmentData) => {
    setLoading(true);
    setError(null);
    try {
      await createAssignment(assignmentData.chit_id, assignmentData.chit_month, memberId);
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

  const handleAssignNew = () => {
    if (mode === "view") {
      navigate(`/members/edit/${memberId}`, { state: { initialTab: "assignments" } });
    } else {
      handleViewChange("new");
    }
  };

  const handleBackNavigation = () => {
    handleViewChange("list");
  };

  // --- Formatters ---
  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
    });

  const formatAmount = (amount) =>
    amount?.toLocaleString("en-IN") || "0";

  // --- Filter Chip Styles ---
  const chipBaseClass =
    "px-2.5 py-1 rounded-full text-xs font-medium transition-colors duration-200 cursor-pointer whitespace-nowrap";
  const chipSelectedClass = "bg-accent text-white";
  const chipUnselectedClass =
    "bg-background-tertiary text-text-secondary hover:bg-background-secondary hover:text-text-primary border border-border";

  const filterOptions = [
    { value: "active", label: "Active" },
    { value: "completed", label: "Completed" },
    { value: "due", label: "Has Due" },
    { value: "paid", label: "Fully Paid" },
  ];

  // --- Main Columns (Chit Rows) ---
  const mainColumns = useMemo(
    () => [
      {
        header: "S.No",
        className: "text-center",
        headerClassName: "text-center",
        cell: (row, index) => (
          <span className="text-text-secondary">{index + 1}</span>
        ),
      },
      {
        header: "Chit",
        className: "text-left",
        headerClassName: "text-left",
        cell: (row) => {
          const isExpanded = expandedChitId === row.chit.id;
          const ExpandIcon = isExpanded ? ChevronUp : ChevronDown;
          return (
            <button
              type="button"
              onClick={() => setExpandedChitId(isExpanded ? null : row.chit.id)}
              className="inline-flex items-center gap-2 font-medium text-text-primary hover:text-accent transition-colors"
              title={isExpanded ? "Collapse" : "View months"}
            >
              <ExpandIcon className="w-4 h-4 text-text-secondary" />
              <span>{row.chit.name}</span>
            </button>
          );
        },
      },
      {
        header: "Status",
        className: "text-center",
        headerClassName: "text-center",
        cell: (row) => {
          // Calculate status from dates if not provided
          const chit = row.chit;
          let status = chit?.status;
          if (!status && chit?.start_date && chit?.end_date) {
            const today = new Date();
            const startDate = new Date(chit.start_date);
            const endDate = new Date(chit.end_date);
            if (today >= startDate && today <= endDate) {
              status = "Active";
            } else if (today < startDate) {
              status = "Upcoming";
            } else {
              status = "Completed";
            }
          }
          return <StatusBadge status={status || "Unknown"} />;
        },
      },
      {
        header: "Contribution",
        className: "text-center",
        headerClassName: "text-center",
        cell: (row) => (
          <span className="text-text-primary">
            ₹{formatAmount(row.chit.base_contribution)}
          </span>
        ),
      },
      {
        header: "Total Due",
        className: "text-center",
        headerClassName: "text-center",
        cell: (row) => (
          <span
            className={
              row.totalDue > 0 ? "text-error-accent font-medium" : "text-success-accent"
            }
          >
            ₹{formatAmount(row.totalDue)}
          </span>
        ),
      },
      {
        header: "Months",
        className: "text-center",
        headerClassName: "text-center",
        cell: (row) => (
          <span className="text-text-secondary">
            {row.months.length}/{row.chit.duration_months || "?"}
          </span>
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
                {onLogCollectionClick && (
                  <button
                    type="button"
                    onClick={() => onLogCollectionClick(row.months[0])}
                    className="p-2 text-sm rounded-md text-success-accent hover:bg-success-accent hover:text-white transition-colors duration-200"
                    title="Log Collection"
                  >
                    <IndianRupee className="w-4 h-4" />
                  </button>
                )}
              </div>
            ),
          },
        ]
        : []),
    ],
    [expandedChitId, mode, onLogCollectionClick]
  );

  // --- Expanded Row: Month Columns ---
  const renderExpandedMonths = (chitGroup) => {
    const monthColumns = [
      {
        header: "Month",
        className: "text-center",
        headerClassName: "text-center",
        cell: (row) => {
          // row.month is the month number (1-20)
          return (
            <span className="text-text-primary font-medium">
              {row.month}
            </span>
          );
        },
      },
      {
        header: "Date",
        className: "text-center",
        headerClassName: "text-center",
        cell: (row) => {
          // Calculate actual date from chit's start_date + month number
          // chitGroup.chit is available from closure scope
          const chit = chitGroup.chit || row.chit;
          if (chit?.start_date && row.month) {
            const startDate = new Date(chit.start_date);
            const actualDate = new Date(startDate.getFullYear(), startDate.getMonth() + (row.month - 1), 1);
            const monthStr = String(actualDate.getMonth() + 1).padStart(2, '0');
            const yearStr = actualDate.getFullYear();
            return <span className="text-text-secondary">{monthStr}/{yearStr}</span>;
          }
          return <span className="text-text-secondary">-</span>;
        },
      },
      {
        header: "Due",
        className: "text-center",
        headerClassName: "text-center",
        cell: (row) => (
          <span
            className={
              row.due_amount > 0 ? "text-error-accent" : "text-text-secondary"
            }
          >
            ₹{formatAmount(row.due_amount)}
          </span>
        ),
      },
      {
        header: "Status",
        className: "text-center",
        headerClassName: "text-center",
        cell: (row) => <StatusBadge status={row.collection_status} />,
      },
      ...(mode !== "view"
        ? [
          {
            header: "Actions",
            className: "text-center",
            headerClassName: "text-center",
            cell: (row) => (
              <div className="flex items-center justify-center space-x-2">
                {onLogCollectionClick && (
                  <button
                    type="button"
                    onClick={() => onLogCollectionClick(row)}
                    className="p-2 text-sm rounded-md text-success-accent hover:bg-success-accent hover:text-white transition-colors duration-200"
                    title="Log Collection"
                  >
                    <IndianRupee className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDeleteClick(row)}
                  className="p-2 text-sm rounded-md text-error-accent hover:bg-error-accent hover:text-white transition-colors duration-200"
                  title="Remove Assignment"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ),
          },
        ]
        : []),
    ];

    return (
      <div className="bg-background-secondary rounded-lg p-4 mt-2 mb-4 border border-border">
        <h4 className="text-sm font-medium text-text-secondary mb-3">
          Assigned Months in {chitGroup.chit.name}
        </h4>
        <Table
          columns={monthColumns}
          data={chitGroup.months}
          variant="secondary"
        />
      </div>
    );
  };

  // --- Render Content ---
  const renderContent = () => {
    if (!memberId && mode === "create") {
      return (
        <p className="text-center text-text-secondary py-8">
          Please save the member's details first to enable assignments.
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
          onChitNameChange={(name) => setActiveChitName(name)}
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
          onChitNameChange={(name) => setActiveChitName(name)}
          onBackToList={() => handleViewChange("list")}
        />
      );
    }

    return (
      <>
        {/* Quick Action Toolbar */}
        {mode !== "view" && (
          <div className="mb-4">
            <div className="p-3 bg-background-secondary rounded-xl shadow-sm border border-border">
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                <span className="hidden sm:inline text-xs text-text-secondary font-medium mr-1">Assign</span>
                <button
                  type="button"
                  onClick={() => handleViewChange("new")}
                  className="p-2 sm:p-2.5 rounded-full bg-success-bg text-success-accent hover:bg-success-accent hover:text-white hover:scale-110 transition-all duration-200 shadow-sm"
                  title="Assign to New Chit"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleViewChange("existing")}
                  className="p-2 sm:p-2.5 rounded-full bg-warning-bg text-warning-accent hover:bg-warning-accent hover:text-white hover:scale-110 transition-all duration-200 shadow-sm"
                  title="Assign to Existing Chit"
                >
                  <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {loading && !groupedByChit.length ? (
          <div className="p-4">
            <Skeleton.Table rows={3} columns={5} />
          </div>
        ) : (
          <>
            {/* Search & Filters */}
            <div className="mb-3 flex flex-col gap-3">
              {/* Search Bar */}
              <div className="relative flex items-center">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="w-5 h-5 text-text-secondary" />
                </span>
                <div className="absolute left-10 h-6 w-px bg-border"></div>
                <input
                  type="text"
                  placeholder="Search chits..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-background-secondary border rounded-md focus:outline-none focus:ring-2 border-border focus:ring-accent"
                />
              </div>

              {/* Filter Chips */}
              <div className="flex overflow-x-auto gap-2 no-scrollbar">
                <button
                  type="button"
                  onClick={() => setStatusFilter(null)}
                  className={`${chipBaseClass} ${statusFilter === null ? chipSelectedClass : chipUnselectedClass
                    }`}
                >
                  All
                </button>
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatusFilter(option.value)}
                    className={`${chipBaseClass} ${statusFilter === option.value
                      ? chipSelectedClass
                      : chipUnselectedClass
                      }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Empty State */}
            {filteredData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-16 h-16 mb-4 rounded-full bg-background-secondary flex items-center justify-center">
                  <ClipboardList className="w-8 h-8 text-text-secondary" />
                </div>
                <p className="text-text-secondary text-center text-sm">
                  {searchQuery || statusFilter
                    ? "No chits match your filter criteria"
                    : "No assignments yet"}
                </p>
                {(searchQuery || statusFilter) && (
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter(null);
                      setSearchQuery("");
                    }}
                    className="mt-3 text-accent text-sm hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className={forceTable ? "block overflow-x-auto" : "hidden md:block overflow-x-auto"}>
                  <Table
                    columns={mainColumns}
                    data={filteredData}
                    variant="secondary"
                    expandedRowRender={(row) =>
                      expandedChitId === row.chit.id ? renderExpandedMonths(row) : null
                    }
                  />
                </div>

                {/* Mobile Cards */}
                {!forceTable && (
                  <div className="block md:hidden space-y-4">
                    {filteredData.map((chitGroup) => (
                      <div
                        key={chitGroup.chit.id}
                        className="bg-background-secondary rounded-lg p-4 border border-border"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedChitId(
                              expandedChitId === chitGroup.chit.id
                                ? null
                                : chitGroup.chit.id
                            )
                          }
                          className="w-full flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            {expandedChitId === chitGroup.chit.id ? (
                              <ChevronUp className="w-4 h-4 text-text-secondary" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-text-secondary" />
                            )}
                            <span className="font-medium text-text-primary">
                              {chitGroup.chit.name}
                            </span>
                          </div>
                          <StatusBadge status={chitGroup.chit.status} />
                        </button>

                        <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                          <div className="text-center">
                            <span className="text-text-secondary block">
                              Contribution
                            </span>
                            <span className="font-medium">
                              ₹{formatAmount(chitGroup.chit.base_contribution)}
                            </span>
                          </div>
                          <div className="text-center">
                            <span className="text-text-secondary block">Due</span>
                            <span
                              className={
                                chitGroup.totalDue > 0
                                  ? "text-error-accent font-medium"
                                  : "text-success-accent"
                              }
                            >
                              ₹{formatAmount(chitGroup.totalDue)}
                            </span>
                          </div>
                          <div className="text-center">
                            <span className="text-text-secondary block">
                              Months
                            </span>
                            <span className="font-medium">
                              {chitGroup.months.length}/
                              {chitGroup.chit.duration_months || "?"}
                            </span>
                          </div>
                        </div>

                        {expandedChitId === chitGroup.chit.id && (
                          <div className="mt-4 pt-4 border-t border-border space-y-2">
                            {chitGroup.months.map((month) => (
                              <div
                                key={month.id}
                                className="flex items-center justify-between bg-background-primary rounded-md p-2"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-text-primary font-medium">
                                    {formatDate(month.chit_month)}
                                  </span>
                                  <StatusBadge status={month.collection_status} />
                                </div>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={
                                      month.due_amount > 0
                                        ? "text-error-accent text-sm"
                                        : "text-text-secondary text-sm"
                                    }
                                  >
                                    ₹{formatAmount(month.due_amount)}
                                  </span>
                                  {mode !== "view" && (
                                    <div className="flex items-center gap-1">
                                      {onLogCollectionClick && (
                                        <button
                                          type="button"
                                          onClick={() => onLogCollectionClick(month)}
                                          className="p-1.5 text-success-accent hover:bg-success-bg rounded"
                                        >
                                          <IndianRupee className="w-4 h-4" />
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteClick(month)}
                                        className="p-1.5 text-error-accent hover:bg-error-bg rounded"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </>
    );
  };

  // --- Header ---
  const getHeaderTitle = () => {
    if (activeChitName) return activeChitName;
    if (view === "new") return "Assign to New Chit";
    if (view === "existing") return "Assign to Existing Chit";
    return "Assignments";
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
          <ClipboardList className="w-6 h-6" /> {getHeaderTitle()}
        </h2>

        {mode === "view" && view === "list" && onManage && (
          <button
            onClick={onManage}
            className="absolute right-0 p-1 text-success-accent hover:bg-success-bg rounded-full transition-colors duration-200 print:hidden"
            title="Assign to Chit"
          >
            <Plus className="w-5 h-5" />
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
        title="Remove Assignment?"
        message={`Are you sure you want to remove this assignment for ${itemToDelete ? formatDate(itemToDelete.chit_month) : ""
          }?`}
        confirmText="Remove"
        loading={deleteLoading}
      />
    </Card>
  );
};

export default MemberChitsManager;
