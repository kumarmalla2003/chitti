// frontend/src/features/chits/components/sections/AssignmentsSection.jsx

import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import Button from "../../../../components/ui/Button";
import Table from "../../../../components/ui/Table";
import Pagination from "../../../../components/ui/Pagination";
import ConfirmationModal from "../../../../components/ui/ConfirmationModal";
import Message from "../../../../components/ui/Message";
import AssignNewMemberForm from "../../../members/components/forms/AssignNewMemberForm";
import AssignExistingMemberForm from "../../../members/components/forms/AssignExistingMemberForm";
import Skeleton from "../../../../components/ui/Skeleton";
import {
  Search,
  ClipboardList,
  Loader2,
  Trash2,
  ArrowLeft,
  UserPlus,
  IndianRupee,
  HandCoins,
  SquarePen,
  Check,
  X,
  User,
  Gavel,
  TrendingUp,
  WalletMinimal,
} from "lucide-react";
import {
  useAssignmentsByChit,
  useUnassignedMonths,
  useDeleteAssignment,
} from "../../../assignments/hooks/useAssignments";
import { useChitDetails } from "../../hooks/useChits";
import { usePayoutsByChit } from "../../../payouts/hooks/usePayouts";
import { useCollectionsByChit, collectionKeys } from "../../../collections/hooks/useCollections";
import { useMembers } from "../../../members/hooks/useMembers";
import { createAssignment, deleteAssignment } from "../../../../services/assignmentsService";
import { updatePayout } from "../../../../services/payoutsService";
import { patchCollection } from "../../../../services/collectionsService";

const ITEMS_PER_PAGE = 10;

// Format number with Indian locale (for display)
const formatIndianNumber = (value) => {
  if (value === "" || value === null || value === undefined) return "";
  const num = typeof value === "string" ? parseFloat(value.replace(/,/g, "")) : value;
  if (isNaN(num)) return "";
  return num.toLocaleString("en-IN");
};

// Parse Indian formatted number to raw number
const parseIndianNumber = (value) => {
  if (!value) return "";
  return value.toString().replace(/,/g, "");
};

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

// Convert MM/YYYY to ISO date string
const monthLabelToISODate = (monthLabel, startDateStr) => {
  if (!startDateStr) return null;
  const [month, year] = monthLabel.split("/");
  const d = new Date(startDateStr);
  d.setFullYear(parseInt(year));
  d.setMonth(parseInt(month) - 1);
  return d.toISOString().split("T")[0];
};

/**
 * Formatted Currency Input component for inline table editing
 * Supports vertical tab navigation (moves to next row in same column on Enter/Tab)
 * Supports cross-page navigation when on the last row of a page
 */
const FormattedCurrencyInput = ({
  value,
  onChange,
  className = "",
  inputId = "",
  nextInputId = "",
  isLastRow = false,
  onNextPage = null,
  columnPrefix = "",
  onEnterSubmit = null
}) => {
  const [displayValue, setDisplayValue] = useState(formatIndianNumber(value));
  const inputRef = useRef(null);

  useEffect(() => {
    setDisplayValue(formatIndianNumber(value));
  }, [value]);

  const handleChange = (e) => {
    const raw = parseIndianNumber(e.target.value);
    setDisplayValue(formatIndianNumber(raw));
    onChange(raw);
  };

  const handleFocus = (e) => {
    // Position cursor at the rightmost position on focus
    const len = e.target.value.length;
    setTimeout(() => {
      e.target.setSelectionRange(len, len);
    }, 0);
  };

  const handleKeyDown = (e) => {
    // Move to next row's input on Enter or Tab
    if ((e.key === "Enter" || e.key === "Tab") && !e.shiftKey) {
      e.preventDefault();

      // If onEnterSubmit is provided, call it (for per-row single column editing)
      if (onEnterSubmit && e.key === "Enter") {
        onEnterSubmit();
        return;
      }

      // Check if next input exists on current page
      const nextInput = document.getElementById(nextInputId);
      if (nextInput) {
        nextInput.focus();
      } else if (isLastRow && onNextPage) {
        // Navigate to next page and focus first input of same column
        onNextPage(() => {
          setTimeout(() => {
            const firstInputOnNextPage = document.getElementById(`${columnPrefix}_row_0`);
            if (firstInputOnNextPage) {
              firstInputOnNextPage.focus();
            }
          }, 100);
        });
      }
    }
  };

  return (
    <div className="relative flex items-center">
      <span className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
        <IndianRupee className="w-3.5 h-3.5 text-text-secondary" />
      </span>
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        inputMode="numeric"
        enterKeyHint="next"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        className={`w-full pl-7 pr-2 py-1.5 text-sm text-center bg-background-primary border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-accent ${className}`}
        placeholder="0"
      />
    </div>
  );
};

/**
 * AssignmentsSection component - unified month-centric view combining
 * members, payouts, auctions, and collections data with inline editing.
 */
const AssignmentsSection = ({ mode, chitId, onLogCollectionClick }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [view, setView] = useState("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMemberName, setActiveMemberName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [success, setSuccess] = useState(null);
  const [localError, setLocalError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Separate edit mode states for per-column inline editing (whole column)
  const [editMembersMode, setEditMembersMode] = useState(false);
  const [editPayoutsMode, setEditPayoutsMode] = useState(false);
  const [editAuctionsMode, setEditAuctionsMode] = useState(false);
  const [editCollectionsMode, setEditCollectionsMode] = useState(false);

  // Per-row edit state (which specific row is being edited from Actions column)
  const [editingRowMember, setEditingRowMember] = useState(null); // monthLabel of row being edited
  const [editingRowPayout, setEditingRowPayout] = useState(null); // payoutId of row being edited
  const [editingRowAuction, setEditingRowAuction] = useState(null); // payoutId of row being edited
  const [editingRowCollection, setEditingRowCollection] = useState(null); // monthIndex of row being edited

  const [editedMembers, setEditedMembers] = useState({}); // { monthLabel: memberId }
  const [editedPayouts, setEditedPayouts] = useState({}); // { payoutId: amount }
  const [editedAuctions, setEditedAuctions] = useState({}); // { payoutId: bidAmount }
  const [editedCollections, setEditedCollections] = useState({}); // { monthKey: amount }
  const [isSaving, setIsSaving] = useState(false);

  // Derived states for edit modes
  const isColumnEditMode = editMembersMode || editPayoutsMode || editAuctionsMode || editCollectionsMode;
  const isPerRowEditMode = editingRowMember !== null || editingRowPayout !== null || editingRowAuction !== null || editingRowCollection !== null;
  const isAnyEditMode = isColumnEditMode || isPerRowEditMode;


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
    refetch: refetchPayouts,
  } = usePayoutsByChit(chitId);

  const {
    data: collectionsResponse,
    isLoading: collectionsLoading,
    refetch: refetchCollections,
  } = useCollectionsByChit(chitId);

  // All members for dropdown
  const {
    data: membersData,
    isLoading: membersLoading,
  } = useMembers();

  const deleteAssignmentMutation = useDeleteAssignment();

  // Extract data from responses
  const assignments = assignmentsResponse?.assignments ?? [];
  const availableMonths = monthsResponse?.available_months ?? [];
  const chitDetails = chitData ?? null;
  const payouts = payoutsResponse?.payouts ?? [];
  const collections = collectionsResponse?.collections ?? [];
  const allMembers = membersData?.members ?? [];

  const loading = assignmentsLoading || chitLoading || payoutsLoading || collectionsLoading;
  const error = localError || (assignmentsError?.message ?? null);

  const assignedMemberIds = useMemo(
    () => assignments.map((a) => a.member.id),
    [assignments]
  );

  const isAuctionType = chitDetails?.chit_type === "auction";

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // --- DATA PROCESSING: Merge all month-centric data ---
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

      // Get collections for this assignment
      let assignmentCollections = [];
      let collectedAmount = 0;
      if (assignment) {
        assignmentCollections = collections.filter(
          (c) => c.chit_assignment_id === assignment.id
        );
        collectedAmount = assignmentCollections.reduce(
          (sum, c) => sum + c.amount_paid,
          0
        );
      }

      const auctionCompleted = isAuctionType && payout?.bid_amount != null;

      rows.push({
        monthIndex: i,
        monthLabel: expectedDateStr,
        assignment: assignment || null,
        payout: payout || null,
        assignmentCollections,
        collectedAmount,
        auctionCompleted,
        bidAmount: payout?.bid_amount || null,
      });
    }
    return rows;
  }, [chitDetails, assignments, payouts, collections, isAuctionType]);

  // Separate enter edit mode handlers for each column - with auto-focus
  const handleEnterMembersEditMode = () => {
    const memberEdits = {};
    allMonthsData.forEach((row) => {
      if (row.assignment) {
        memberEdits[row.monthLabel] = row.assignment.member.id.toString();
      }
    });
    setEditedMembers(memberEdits);
    setEditMembersMode(true);
    // Auto-focus to first member select
    setTimeout(() => {
      const input = document.getElementById("member_row_0");
      if (input) input.focus();
    }, 100);
  };

  const handleEnterPayoutsEditMode = () => {
    const payoutEdits = {};
    payouts.forEach((p) => {
      payoutEdits[p.id] = p.planned_amount?.toString() || "";
    });
    setEditedPayouts(payoutEdits);
    setEditPayoutsMode(true);
    // Auto-focus to first payout input
    setTimeout(() => {
      const input = document.getElementById("payout_row_0");
      if (input) input.focus();
    }, 100);
  };

  const handleEnterAuctionsEditMode = () => {
    const auctionEdits = {};
    payouts.forEach((p) => {
      // Use planned_amount as default for auction (same pattern as payout)
      auctionEdits[p.id] = p.bid_amount?.toString() || p.planned_amount?.toString() || "";
    });
    setEditedAuctions(auctionEdits);
    setEditAuctionsMode(true);
    // Auto-focus to first auction input
    setTimeout(() => {
      const input = document.getElementById("auction_row_0");
      if (input) input.focus();
    }, 100);
  };

  const handleEnterCollectionsEditMode = () => {
    const collectionEdits = {};
    allMonthsData.forEach((row) => {
      collectionEdits[`month_${row.monthIndex}`] = row.collectedAmount?.toString() || "";
    });
    setEditedCollections(collectionEdits);
    setEditCollectionsMode(true);
    // Auto-focus to first collection input
    setTimeout(() => {
      const input = document.getElementById("collection_row_0");
      if (input) input.focus();
    }, 100);
  };

  // Enter all edit modes at once (for Edit All button) - focuses first member input
  const handleEnterEditMode = () => {
    handleEnterMembersEditMode();
    handleEnterPayoutsEditMode();
    if (isAuctionType) handleEnterAuctionsEditMode();
    handleEnterCollectionsEditMode();
    // Focus first member input (overrides individual focuses)
    setTimeout(() => {
      const input = document.getElementById("member_row_0");
      if (input) input.focus();
    }, 150);
  };

  // Per-row edit handlers (from Actions column) - with auto-focus
  const handleEnterRowMemberEdit = (row) => {
    if (row.assignment) {
      setEditedMembers({ [row.monthLabel]: row.assignment.member.id.toString() });
    } else {
      setEditedMembers({ [row.monthLabel]: "" });
    }
    setEditingRowMember(row.monthLabel);
    // Auto-focus to member select
    setTimeout(() => {
      const input = document.getElementById(`member_select_row_${row.monthLabel}`);
      if (input) input.focus();
    }, 100);
  };

  const handleEnterRowPayoutEdit = (row) => {
    if (row.payout) {
      setEditedPayouts({ [row.payout.id]: row.payout.planned_amount?.toString() || "" });
      setEditingRowPayout(row.payout.id);
      // Auto-focus to payout input
      setTimeout(() => {
        const input = document.getElementById(`payout_input_row_${row.payout.id}`);
        if (input) input.focus();
      }, 100);
    }
  };

  const handleEnterRowAuctionEdit = (row) => {
    if (row.payout) {
      setEditedAuctions({ [row.payout.id]: row.payout.bid_amount?.toString() || "" });
      setEditingRowAuction(row.payout.id);
      // Auto-focus to auction input
      setTimeout(() => {
        const input = document.getElementById(`auction_input_row_${row.payout.id}`);
        if (input) input.focus();
      }, 100);
    }
  };

  const handleEnterRowCollectionEdit = (row) => {
    const collectionKey = `month_${row.monthIndex}`;
    setEditedCollections({ [collectionKey]: row.collectedAmount?.toString() || "" });
    setEditingRowCollection(row.monthIndex);
    // Auto-focus to collection input
    setTimeout(() => {
      const input = document.getElementById(`collection_input_row_${row.monthIndex}`);
      if (input) input.focus();
    }, 100);
  };

  // Edit all columns for a specific row - focuses on Member first
  const handleEnterRowAllEdit = (row) => {
    // Member
    if (row.assignment) {
      setEditedMembers({ [row.monthLabel]: row.assignment.member.id.toString() });
    } else {
      setEditedMembers({ [row.monthLabel]: "" });
    }
    setEditingRowMember(row.monthLabel);
    // Payout
    if (row.payout) {
      setEditedPayouts({ [row.payout.id]: row.payout.planned_amount?.toString() || "" });
      setEditingRowPayout(row.payout.id);
      // Auction (if applicable)
      if (isAuctionType) {
        setEditedAuctions({ [row.payout.id]: row.payout.bid_amount?.toString() || "" });
        setEditingRowAuction(row.payout.id);
      }
      // Collection
      const collectionKey = `month_${row.monthIndex}`;
      setEditedCollections({ [collectionKey]: row.collectedAmount?.toString() || "" });
      setEditingRowCollection(row.monthIndex);
    }
    // Auto-focus to member select (first field)
    setTimeout(() => {
      const input = document.getElementById(`member_select_row_${row.monthLabel}`);
      if (input) input.focus();
    }, 100);
  };

  // Cancel only per-row editing (not column editing)
  const handleCancelRowEdit = () => {
    setEditingRowMember(null);
    setEditingRowPayout(null);
    setEditingRowAuction(null);
    setEditingRowCollection(null);
    setEditedMembers({});
    setEditedPayouts({});
    setEditedAuctions({});
    setEditedCollections({});
    setLocalError(null);
  };

  const handleCancelEditMode = () => {
    // Reset column edit modes
    setEditMembersMode(false);
    setEditPayoutsMode(false);
    setEditAuctionsMode(false);
    setEditCollectionsMode(false);
    // Reset per-row edit states
    setEditingRowMember(null);
    setEditingRowPayout(null);
    setEditingRowAuction(null);
    setEditingRowCollection(null);
    // Clear edited data
    setEditedMembers({});
    setEditedPayouts({});
    setEditedAuctions({});
    setEditedCollections({});
    setLocalError(null);
  };

  const handleMemberChange = (monthLabel, memberId) => {
    setEditedMembers((prev) => ({
      ...prev,
      [monthLabel]: memberId,
    }));
  };

  const handlePayoutChange = (payoutId, amount) => {
    setEditedPayouts((prev) => ({
      ...prev,
      [payoutId]: amount,
    }));
  };

  const handleCollectionChange = (collectionId, amount) => {
    setEditedCollections((prev) => ({
      ...prev,
      [collectionId]: amount,
    }));
  };

  const handleAuctionChange = (payoutId, amount) => {
    setEditedAuctions((prev) => ({
      ...prev,
      [payoutId]: amount,
    }));
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setLocalError(null);

    try {
      const promises = [];

      // 1. Process member assignments
      for (const row of allMonthsData) {
        const newMemberId = editedMembers[row.monthLabel];
        const currentMemberId = row.assignment?.member?.id?.toString();

        if (newMemberId !== currentMemberId) {
          if (row.assignment && newMemberId !== currentMemberId) {
            promises.push(deleteAssignment(row.assignment.id));
          }
          if (newMemberId && newMemberId !== "") {
            const isoDate = monthLabelToISODate(row.monthLabel, chitDetails?.start_date);
            if (isoDate) {
              promises.push(
                createAssignment({
                  chit_id: chitId,
                  member_id: parseInt(newMemberId),
                  chit_month: isoDate,
                })
              );
            }
          }
        }
      }

      // 2. Process payout changes
      for (const [payoutId, newAmount] of Object.entries(editedPayouts)) {
        const originalPayout = payouts.find((p) => p.id === parseInt(payoutId));
        if (originalPayout) {
          const newAmountNum = parseFloat(newAmount) || 0;
          if (originalPayout.planned_amount !== newAmountNum) {
            promises.push(
              updatePayout(parseInt(payoutId), { planned_amount: newAmountNum })
            );
          }
        }
      }

      // 3. Process auction changes (bid_amount is part of payout)
      if (isAuctionType) {
        for (const [payoutId, newBidAmount] of Object.entries(editedAuctions)) {
          const originalPayout = payouts.find((p) => p.id === parseInt(payoutId));
          if (originalPayout) {
            const newBidNum = parseFloat(newBidAmount) || 0;
            if (originalPayout.bid_amount !== newBidNum) {
              promises.push(
                updatePayout(parseInt(payoutId), { bid_amount: newBidNum })
              );
            }
          }
        }
      }

      // 4. Process collection changes
      for (const [collectionId, newAmount] of Object.entries(editedCollections)) {
        const originalCollection = collections.find((c) => c.id === parseInt(collectionId));
        if (originalCollection) {
          const newAmountNum = parseFloat(newAmount) || 0;
          if (originalCollection.amount_paid !== newAmountNum) {
            promises.push(
              patchCollection(parseInt(collectionId), { amount_paid: newAmountNum })
            );
          }
        }
      }

      await Promise.all(promises);

      // Refresh data
      await Promise.all([
        refetchAssignments(),
        refetchMonths(),
        refetchPayouts(),
        refetchCollections(),
        queryClient.invalidateQueries({ queryKey: collectionKeys.byChit(chitId) }),
      ]);

      setSuccess("Changes saved successfully!");
      handleCancelEditMode();
    } catch (err) {
      setLocalError(err.message || "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddMemberClick = () => {
    if (mode === "view") {
      navigate(`/chits/edit/${chitId}`, { state: { initialTab: "assignments" } });
    }
  };

  const handleAssignment = async (assignmentData) => {
    setLocalError(null);
    try {
      await createAssignment(assignmentData);
      setSuccess("Member assigned successfully!");
      setView("list");
      setActiveMemberName("");
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

  const filteredData = useMemo(() => {
    if (!searchQuery) return allMonthsData;
    const lowerQuery = searchQuery.toLowerCase();
    return allMonthsData.filter((row) => {
      // Search across all columns
      const monthNum = row.monthIndex.toString();
      const dateStr = row.monthLabel.toLowerCase();
      const memberName = row.assignment?.member.full_name.toLowerCase() || "";
      const payoutAmount = row.payout?.planned_amount?.toString() || "";
      const auctionAmount = row.bidAmount?.toString() || "";
      const collectionAmount = row.collectedAmount?.toString() || "";

      return (
        monthNum.includes(lowerQuery) ||
        dateStr.includes(lowerQuery) ||
        memberName.includes(lowerQuery) ||
        payoutAmount.includes(lowerQuery) ||
        auctionAmount.includes(lowerQuery) ||
        collectionAmount.includes(lowerQuery)
      );
    });
  }, [allMonthsData, searchQuery]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  // Helper for cross-page navigation
  const handleNextPageFocus = (callback) => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      if (callback) callback();
    }
  };

  // --- TABLE COLUMNS ---
  const columns = useMemo(() => {
    const baseColumns = [
      {
        header: "Month",
        cell: (row) => row.monthIndex,
        className: "text-center font-medium",
        headerClassName: "text-center",
      },
      {
        header: "Date",
        accessor: "monthLabel",
        className: "text-center",
        headerClassName: "text-center",
      },
      {
        header: "Member",
        className: "text-center",
        headerClassName: "text-center",
        cell: (row, rowIndex) => {
          // Show edit input if column mode OR this specific row is being edited
          const isEditing = editMembersMode || editingRowMember === row.monthLabel;
          if (isEditing) {
            // Check if we're in "edit all row" mode (multiple columns being edited)
            const isEditAllRowMode = editingRowMember !== null && editingRowPayout !== null;
            // Determine input ID based on mode
            const inputId = editingRowMember !== null ? `member_select_row_${row.monthLabel}` : `member_row_${rowIndex}`;

            const handleKeyDown = (e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (isEditAllRowMode && row.payout) {
                  // Navigate to payout input
                  const nextInput = document.getElementById(`payout_input_row_${row.payout.id}`);
                  if (nextInput) nextInput.focus();
                } else {
                  // Submit (single column edit)
                  handleSaveChanges();
                }
              }
            };

            return (
              <select
                id={inputId}
                value={editedMembers[row.monthLabel] || ""}
                onChange={(e) => handleMemberChange(row.monthLabel, e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full min-w-[140px] px-2 py-1.5 text-sm bg-background-primary border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="">Select member...</option>
                {allMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.full_name}
                  </option>
                ))}
              </select>
            );
          }
          return row.assignment ? (
            <span className="font-medium text-text-primary">
              {row.assignment.member.full_name}
            </span>
          ) : (
            <span className="text-text-secondary italic">-</span>
          );
        },
      },
      {
        header: "Payout",
        className: "text-center",
        headerClassName: "text-center",
        cell: (row, rowIndex) => {
          // Show edit input if column mode OR this specific row is being edited
          const isEditing = editPayoutsMode || editingRowPayout === row.payout?.id;
          if (isEditing && row.payout) {
            const nextRowIndex = rowIndex + 1;
            const isLastRow = rowIndex === paginatedData.length - 1;
            // Check if we're in "edit all row" mode
            const isEditAllRowMode = editingRowPayout !== null && editingRowCollection !== null;
            // Determine next field for Enter key
            const getNextInputId = () => {
              if (isEditAllRowMode) {
                if (isAuctionType) return `auction_input_row_${row.payout.id}`;
                return `collection_input_row_${row.monthIndex}`;
              }
              return editPayoutsMode ? `payout_row_${nextRowIndex}` : "";
            };
            return (
              <FormattedCurrencyInput
                value={editedPayouts[row.payout.id] ?? ""}
                onChange={(val) => handlePayoutChange(row.payout.id, val)}
                className="min-w-[120px]"
                inputId={editingRowPayout !== null ? `payout_input_row_${row.payout.id}` : `payout_row_${rowIndex}`}
                nextInputId={getNextInputId()}
                isLastRow={isLastRow}
                onNextPage={editPayoutsMode ? handleNextPageFocus : null}
                columnPrefix="payout"
                onEnterSubmit={!isEditAllRowMode && !editPayoutsMode ? handleSaveChanges : null}
              />
            );
          }
          return (
            <span
              className={
                row.payout?.amount > 0
                  ? "text-warning-accent font-medium"
                  : "text-text-primary"
              }
            >
              {row.payout?.amount > 0
                ? `₹${formatAmount(row.payout.amount)}`
                : row.payout?.planned_amount
                  ? `₹${formatAmount(row.payout.planned_amount)}`
                  : "-"}
            </span>
          );
        },
      },
    ];

    // Add Auction column for auction-type chits
    if (isAuctionType) {
      baseColumns.push({
        header: "Auction",
        className: "text-center",
        headerClassName: "text-center",
        cell: (row, rowIndex) => {
          // Show edit input if column mode OR this specific row is being edited
          const isEditing = editAuctionsMode || editingRowAuction === row.payout?.id;
          if (isEditing && row.payout) {
            const nextRowIndex = rowIndex + 1;
            const isLastRow = rowIndex === paginatedData.length - 1;
            // Check if we're in "edit all row" mode
            const isEditAllRowMode = editingRowAuction !== null && editingRowCollection !== null;
            // In edit all row mode, navigate to collection input on Enter
            const getNextInputId = () => {
              if (isEditAllRowMode) return `collection_input_row_${row.monthIndex}`;
              return editAuctionsMode ? `auction_row_${nextRowIndex}` : "";
            };
            return (
              <FormattedCurrencyInput
                value={editedAuctions[row.payout.id] ?? ""}
                onChange={(val) => handleAuctionChange(row.payout.id, val)}
                className="min-w-[120px]"
                inputId={editingRowAuction !== null ? `auction_input_row_${row.payout.id}` : `auction_row_${rowIndex}`}
                nextInputId={getNextInputId()}
                isLastRow={isLastRow}
                onNextPage={editAuctionsMode ? handleNextPageFocus : null}
                columnPrefix="auction"
                onEnterSubmit={!isEditAllRowMode && !editAuctionsMode ? handleSaveChanges : null}
              />
            );
          }
          return (
            <span className={row.bidAmount ? "text-accent font-medium" : "text-text-secondary"}>
              {row.bidAmount ? `₹${formatAmount(row.bidAmount)}` : "-"}
            </span>
          );
        },
      });
    }

    baseColumns.push({
      header: "Collection",
      className: "text-center",
      headerClassName: "text-center",
      cell: (row, rowIndex) => {
        // Show edit input if column mode OR this specific row is being edited
        const isEditing = editCollectionsMode || editingRowCollection === row.monthIndex;
        if (isEditing && row.payout) {
          const collectionKey = `month_${row.monthIndex}`;
          const nextRowIndex = rowIndex + 1;
          const isLastRow = rowIndex === paginatedData.length - 1;
          // Check if we're in "edit all row" mode - Collection is the last field, always submit on Enter
          const isEditAllRowMode = editingRowCollection !== null;
          return (
            <FormattedCurrencyInput
              value={editedCollections[collectionKey] ?? row.collectedAmount?.toString() ?? ""}
              onChange={(val) => handleCollectionChange(collectionKey, val)}
              className="min-w-[120px]"
              inputId={isEditAllRowMode ? `collection_input_row_${row.monthIndex}` : `collection_row_${rowIndex}`}
              nextInputId={editCollectionsMode ? `collection_row_${nextRowIndex}` : ""}
              isLastRow={isLastRow}
              onNextPage={editCollectionsMode ? handleNextPageFocus : null}
              columnPrefix="collection"
              onEnterSubmit={!editCollectionsMode ? handleSaveChanges : null}
            />
          );
        }
        return (
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
        );
      },
    });

    // Actions column - different views based on edit state
    if (mode !== "view" && !isColumnEditMode) {
      baseColumns.push({
        header: "Actions",
        className: "text-center",
        headerClassName: "text-center",
        cell: (row) => {
          // Check if THIS row is in per-row edit mode
          const isThisRowEditing =
            editingRowMember === row.monthLabel ||
            editingRowPayout === row.payout?.id ||
            editingRowAuction === row.payout?.id ||
            editingRowCollection === row.monthIndex;

          // Show Save/Cancel for this row if it's being edited
          if (isThisRowEditing) {
            return (
              <div className="flex items-center justify-center space-x-1">
                {/* Cancel */}
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={handleCancelRowEdit}
                  className="p-1.5 text-sm rounded-md text-error-accent hover:bg-error-accent hover:text-white focus:outline-none transition-colors duration-200"
                  title="Cancel"
                  disabled={isSaving}
                >
                  <X className="w-4 h-4" />
                </button>
                {/* Save */}
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={handleSaveChanges}
                  className="p-1.5 text-sm rounded-md text-success-accent hover:bg-success-accent hover:text-white focus:outline-none transition-colors duration-200"
                  title="Save"
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                </button>
              </div>
            );
          }

          // Show action buttons when not in any per-row edit mode
          if (!isPerRowEditMode) {
            return (
              <div className="flex items-center justify-center space-x-1">
                {/* Edit All Row - enables editing all columns for THIS ROW */}
                <button
                  type="button"
                  onClick={() => handleEnterRowAllEdit(row)}
                  className="p-1.5 text-sm rounded-md text-accent hover:bg-accent hover:text-white transition-colors duration-200"
                  title="Edit Row"
                >
                  <SquarePen className="w-4 h-4" />
                </button>
                {/* Assign Member - enables inline member editing for THIS ROW */}
                <button
                  type="button"
                  onClick={() => handleEnterRowMemberEdit(row)}
                  className="p-1.5 text-sm rounded-md text-warning-accent hover:bg-warning-accent hover:text-white transition-colors duration-200"
                  title="Assign Member"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
                {/* Edit Payout - enables inline payout editing for THIS ROW */}
                {row.payout && (
                  <button
                    type="button"
                    onClick={() => handleEnterRowPayoutEdit(row)}
                    className="p-1.5 text-sm rounded-md text-warning-accent hover:bg-warning-accent hover:text-white transition-colors duration-200"
                    title="Edit Payout"
                  >
                    <TrendingUp className="w-4 h-4" />
                  </button>
                )}
                {/* Edit Auction - only for auction-type chits, for THIS ROW */}
                {isAuctionType && row.payout && (
                  <button
                    type="button"
                    onClick={() => handleEnterRowAuctionEdit(row)}
                    className="p-1.5 text-sm rounded-md text-warning-accent hover:bg-warning-accent hover:text-white transition-colors duration-200"
                    title="Edit Auction"
                  >
                    <Gavel className="w-4 h-4" />
                  </button>
                )}
                {/* Edit Collection - enables inline collection editing for THIS ROW */}
                {row.payout && (
                  <button
                    type="button"
                    onClick={() => handleEnterRowCollectionEdit(row)}
                    className="p-1.5 text-sm rounded-md text-warning-accent hover:bg-warning-accent hover:text-white transition-colors duration-200"
                    title="Edit Collection"
                  >
                    <WalletMinimal className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          }

          // Another row is being edited - show nothing for this row
          return null;
        },
      });
    }

    return baseColumns;
  }, [mode, isAnyEditMode, isColumnEditMode, isPerRowEditMode, editMembersMode, editPayoutsMode, editAuctionsMode, editCollectionsMode, editingRowMember, editingRowPayout, editingRowAuction, editingRowCollection, isAuctionType, editedMembers, editedPayouts, editedAuctions, editedCollections, allMembers, paginatedData, currentPage, totalPages, isSaving]);

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

    return (
      <>
        {/* --- ACTION BUTTONS (when not in edit mode) --- */}
        {mode !== "view" && !isAnyEditMode && (
          <div className="mb-4">
            {/* Row 1: Edit All button (full width) */}
            <div className="flex gap-2">
              <Button
                onClick={handleEnterEditMode}
                className="w-full flex items-center justify-center"
                size="sm"
              >
                <SquarePen className="w-4 h-4 mr-1.5" />
                <span>Edit All</span>
              </Button>
            </div>
            {/* Row 2: Quick Action Toolbar - Beautiful card design, responsive */}
            <div className="mt-3 p-3 bg-background-secondary rounded-xl shadow-sm border border-border">
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                {/* Group 1: Member Actions */}
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  <span className="hidden sm:inline text-xs text-text-secondary font-medium mr-1">Members</span>
                  {/* New Member */}
                  <button
                    type="button"
                    onClick={() => handleViewChange("new")}
                    className="p-2 sm:p-2.5 rounded-full bg-success-bg text-success-accent hover:bg-success-accent hover:text-white hover:scale-110 transition-all duration-200 shadow-sm"
                    title="New Member"
                  >
                    <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  {/* Existing Member */}
                  <button
                    type="button"
                    onClick={() => handleViewChange("existing")}
                    className="p-2 sm:p-2.5 rounded-full bg-success-bg text-success-accent hover:bg-success-accent hover:text-white hover:scale-110 transition-all duration-200 shadow-sm"
                    title="Existing Member"
                  >
                    <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>

                {/* Divider */}
                <div className="h-6 sm:h-8 w-px bg-border"></div>

                {/* Group 2: Edit Actions */}
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  <span className="hidden sm:inline text-xs text-text-secondary font-medium mr-1">Edit</span>
                  {/* Edit All Members */}
                  <button
                    type="button"
                    onClick={handleEnterMembersEditMode}
                    className="p-2 sm:p-2.5 rounded-full bg-warning-bg text-warning-accent hover:bg-warning-accent hover:text-white hover:scale-110 transition-all duration-200 shadow-sm"
                    title="Edit All Members"
                  >
                    <User className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  {/* Edit All Payouts */}
                  <button
                    type="button"
                    onClick={handleEnterPayoutsEditMode}
                    className="p-2 sm:p-2.5 rounded-full bg-warning-bg text-warning-accent hover:bg-warning-accent hover:text-white hover:scale-110 transition-all duration-200 shadow-sm"
                    title="Edit All Payouts"
                  >
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  {/* Edit All Auctions - only for auction-type chits */}
                  {isAuctionType && (
                    <button
                      type="button"
                      onClick={handleEnterAuctionsEditMode}
                      className="p-2 sm:p-2.5 rounded-full bg-warning-bg text-warning-accent hover:bg-warning-accent hover:text-white hover:scale-110 transition-all duration-200 shadow-sm"
                      title="Edit All Auctions"
                    >
                      <Gavel className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  )}
                  {/* Edit All Collections */}
                  <button
                    type="button"
                    onClick={handleEnterCollectionsEditMode}
                    className="p-2 sm:p-2.5 rounded-full bg-warning-bg text-warning-accent hover:bg-warning-accent hover:text-white hover:scale-110 transition-all duration-200 shadow-sm"
                    title="Edit All Collections"
                  >
                    <WalletMinimal className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- EDIT MODE SAVE/CANCEL BUTTONS (only for column-level editing) --- */}
        {isColumnEditMode && (
          <div className="mb-4">
            <div className="flex justify-between gap-3">
              {/* Cancel Button - Left side */}
              <Button
                onClick={handleCancelEditMode}
                variant="error"
                className="flex items-center justify-center"
                size="sm"
                disabled={isSaving}
              >
                <X className="w-4 h-4 mr-1.5" />
                <span>Cancel</span>
              </Button>
              {/* Save Button - Right side */}
              <Button
                onClick={handleSaveChanges}
                variant="success"
                className="flex items-center justify-center"
                size="sm"
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-1.5" />
                )}
                <span>Save</span>
              </Button>
            </div>
          </div>
        )}

        {loading && !allMonthsData.length ? (
          <div className="p-4">
            <Skeleton.Table rows={5} columns={6} />
          </div>
        ) : (
          <>
            {/* Search Bar - hide in edit mode */}
            {!isAnyEditMode && (
              <div className="relative flex items-center mb-4">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="w-5 h-5 text-text-secondary" />
                </span>
                <div className="absolute left-10 h-6 w-px bg-border"></div>
                <input
                  type="text"
                  placeholder="Search by member or month..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-background-secondary border rounded-md focus:outline-none focus:ring-2 border-border focus:ring-accent"
                />
              </div>
            )}

            {/* Table - no scrollbar, fixed column widths */}
            <div className="block">
              <Table
                columns={columns}
                data={paginatedData}
                variant="secondary"
              />
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
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
    if (isAnyEditMode) return "Edit Mode";
    return "Assignments";
  };

  const HeaderIcon = view === "list" ? ClipboardList : UserPlus;

  return (
    <div className="flex-1 flex flex-col">
      <div className="relative flex justify-center items-center mb-2">
        {(view !== "list" || isAnyEditMode) && (
          <button
            onClick={isAnyEditMode ? handleCancelEditMode : handleBackNavigation}
            className="absolute left-0 text-text-primary hover:text-accent"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <HeaderIcon className="w-6 h-6" /> {getHeaderTitle()}
        </h2>
        {mode === "view" && view === "list" && !isAnyEditMode && (
          <button
            onClick={handleAddMemberClick}
            className="absolute right-0 p-1 text-success-accent hover:bg-success-bg rounded-full transition-colors duration-200 print:hidden"
            title="Add Member"
          >
            <SquarePen className="w-5 h-5" />
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

export default AssignmentsSection;
