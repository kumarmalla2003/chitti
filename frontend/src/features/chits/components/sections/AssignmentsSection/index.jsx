// frontend/src/features/chits/components/sections/AssignmentsSection/index.jsx

import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import Button from "../../../../../components/ui/Button";
import Table from "../../../../../components/ui/Table";
import Pagination from "../../../../../components/ui/Pagination";
import ConfirmationModal from "../../../../../components/ui/ConfirmationModal";
import Message from "../../../../../components/ui/Message";
import AssignNewMemberForm from "../../../../members/components/forms/AssignNewMemberForm";
import Skeleton from "../../../../../components/ui/Skeleton";
import FormattedCurrencyInput from "./components/FormattedCurrencyInput";
import MonthMemberBreakdown from "./components/MonthMemberBreakdown";
import { useAssignmentsEdit } from "./hooks/useAssignmentsEdit";
import {
    formatAmount,
    formatDate,
    calculateMonthDate,
    getItemsPerPage,
    FILTER_OPTIONS,
} from "./utils/helpers";
import {
    Search,
    ClipboardList,
    Loader2,
    Trash2,
    ArrowLeft,
    UserPlus,
    HandCoins,
    SquarePen,
    Check,
    X,
    User,
    Gavel,
    TrendingUp,
    WalletMinimal,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import {
    useAssignmentsByChit,
    useUnassignedMonths,
    useDeleteAssignment,
} from "../../../../assignments/hooks/useAssignments";
import { useChitDetails } from "../../../hooks/useChits";
import { usePayoutsByChit } from "../../../../payouts/hooks/usePayouts";
import { collectionKeys } from "../../../../collections/hooks/useCollections";
import { useMembers } from "../../../../members/hooks/useMembers";
import { createAssignment } from "../../../../../services/assignmentsService";

/**
 * AssignmentsSection component - unified month-centric view combining
 * members, payouts, auctions, and collections data with inline editing.
 * Refactored with extracted hooks, components, and filter chips.
 */
const AssignmentsSection = ({ mode, chitId, onLogCollectionClick }) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const formRef = useRef(null);

    // --- UI State ---
    const [view, setView] = useState("list");
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState(null); // null = "All"
    const [activeMemberName, setActiveMemberName] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(getItemsPerPage);
    const [success, setSuccess] = useState(null);
    const [localError, setLocalError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [expandedMonth, setExpandedMonth] = useState(null); // Track which month is expanded

    // --- Responsive Items Per Page ---
    useEffect(() => {
        const handleResize = () => setItemsPerPage(getItemsPerPage());
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // --- React Query Hooks ---
    const {
        data: assignmentsResponse,
        isLoading: assignmentsLoading,
        error: assignmentsError,
        refetch: refetchAssignments,
    } = useAssignmentsByChit(chitId);

    const { data: monthsResponse, refetch: refetchMonths } = useUnassignedMonths(chitId);
    const { data: chitData, isLoading: chitLoading } = useChitDetails(chitId);
    const { data: payoutsResponse, isLoading: payoutsLoading, refetch: refetchPayouts } = usePayoutsByChit(chitId);
    // Note: Collections API is deprecated - collection data is now in assignment.expected_contribution
    const { data: membersData, isLoading: membersLoading } = useMembers();
    const deleteAssignmentMutation = useDeleteAssignment();

    // --- Extract Data ---
    // API returns { slots: [...] }, not { assignments: [...] }
    const assignments = assignmentsResponse?.slots ?? [];
    const availableMonths = monthsResponse?.available_months ?? [];
    const chitDetails = chitData ?? null;
    // Note: Payouts API also returns { slots: [...] } not { payouts: [...] }
    const payouts = payoutsResponse?.slots ?? [];
    const allMembers = membersData?.members ?? [];

    const loading = assignmentsLoading || chitLoading || payoutsLoading;
    const error = localError || (assignmentsError?.message ?? null);

    const isAuctionType = chitDetails?.chit_type === "auction";

    // --- Build Month-Centric Data ---
    const allMonthsData = useMemo(() => {
        if (!chitDetails) return [];
        const totalMonths = chitDetails.duration_months;
        const rows = [];

        for (let i = 1; i <= totalMonths; i++) {
            const expectedDateStr = calculateMonthDate(chitDetails.start_date, i);
            // Match assignment by month number (API returns 'month' as number, not 'chit_month' as date)
            const assignment = assignments.find((a) => a.month === i);
            const payout = payouts.find((p) => p.month === i);

            // Expected amount comes from assignment.expected_contribution (slots data)
            // Backend now handles the formula for Variable and Fixed chits to return Monthly TOTAL
            const expectedAmount = assignment?.expected_contribution || 0;

            const auctionCompleted = isAuctionType && payout?.bid_amount != null;

            rows.push({
                monthIndex: i,
                monthLabel: expectedDateStr,
                assignment: assignment || null,
                payout: payout || null,
                expectedAmount, // From slot's expected_contribution
                auctionCompleted,
                bidAmount: payout?.bid_amount || null,
            });
        }
        return rows;
    }, [chitDetails, assignments, payouts, isAuctionType]);

    // --- Edit Hook ---
    const editHook = useAssignmentsEdit({
        chitId,
        chitDetails,
        allMonthsData,
        payouts,
        allMembers,
        isAuctionType,
        refetchAssignments,
        refetchMonths,
        refetchPayouts,
    });

    const {
        editMembersMode, editPayoutsMode, editAuctionsMode, editCollectionsMode,
        editingRowMember, editingRowPayout, editingRowAuction, editingRowCollection,
        isColumnEditMode, isPerRowEditMode, isAnyEditMode,
        editedMembers, editedPayouts, editedAuctions, editedCollections,
        isSaving, savingCells,
        handleEnterMembersEditMode, handleEnterPayoutsEditMode, handleEnterAuctionsEditMode, handleEnterCollectionsEditMode,
        handleEnterEditMode,
        handleEnterRowMemberEdit, handleEnterRowPayoutEdit, handleEnterRowAuctionEdit, handleEnterRowCollectionEdit, handleEnterRowAllEdit,
        handleCancelRowEdit, handleCancelEditMode,
        handleMemberChange, handlePayoutChange, handleAuctionChange, handleCollectionChange,
        handleSaveChanges: saveChanges,
    } = editHook;

    // Wrap save to handle success/error messages
    const handleSaveChanges = async () => {
        const result = await saveChanges();
        if (result.success) {
            setSuccess(result.message);
        } else {
            setLocalError(result.error);
        }
    };

    // --- Effects ---
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter]);

    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    // --- Filter & Search ---
    const filteredData = useMemo(() => {
        let data = allMonthsData;

        // Apply status filter - individual per column
        if (statusFilter === "members_assigned") {
            data = data.filter((row) => row.assignment !== null);
        } else if (statusFilter === "members_unassigned") {
            data = data.filter((row) => row.assignment === null);
        } else if (statusFilter === "payouts_assigned") {
            data = data.filter((row) => row.payout?.payout_amount > 0);
        } else if (statusFilter === "payouts_unassigned") {
            data = data.filter((row) => !row.payout?.payout_amount);
        } else if (statusFilter === "auctions_assigned") {
            data = data.filter((row) => row.bidAmount > 0);
        } else if (statusFilter === "auctions_unassigned") {
            data = data.filter((row) => !row.bidAmount || row.bidAmount === 0);
        } else if (statusFilter === "collections_assigned") {
            data = data.filter((row) => row.expectedAmount > 0);
        } else if (statusFilter === "collections_unassigned") {
            data = data.filter((row) => !row.expectedAmount || row.expectedAmount === 0);
        }

        // Apply search
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            data = data.filter((row) => {
                const monthNum = row.monthIndex.toString();
                const dateStr = row.monthLabel.toLowerCase();
                const memberName = row.assignment?.member.full_name.toLowerCase() || "";
                const payoutAmount = row.payout?.payout_amount?.toString() || "";
                const auctionAmount = row.bidAmount?.toString() || "";
                const collectionAmount = row.expectedAmount?.toString() || "";
                return (
                    monthNum.includes(lowerQuery) ||
                    dateStr.includes(lowerQuery) ||
                    memberName.includes(lowerQuery) ||
                    payoutAmount.includes(lowerQuery) ||
                    auctionAmount.includes(lowerQuery) ||
                    collectionAmount.includes(lowerQuery)
                );
            });
        }

        return data;
    }, [allMonthsData, statusFilter, searchQuery]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredData.slice(start, start + itemsPerPage);
    }, [filteredData, currentPage, itemsPerPage]);

    const handleNextPageFocus = (callback) => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
            if (callback) callback();
        }
    };

    // --- Handlers ---
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

    // --- Filter Chip Styles ---
    const chipBaseClass = "px-2.5 py-1 rounded-full text-xs font-medium transition-colors duration-200 cursor-pointer whitespace-nowrap";
    const chipSelectedClass = "bg-accent text-white";
    const chipUnselectedClass = "bg-background-tertiary text-text-secondary hover:bg-background-secondary hover:text-text-primary border border-border";

    // --- Table Columns ---
    const columns = useMemo(() => {
        const baseColumns = [
            {
                header: "Month",
                cell: (row) => {
                    const isExpanded = expandedMonth === row.monthIndex;
                    const ExpandIcon = isExpanded ? ChevronUp : ChevronDown;
                    return (
                        <button
                            type="button"
                            onClick={() => setExpandedMonth(isExpanded ? null : row.monthIndex)}
                            className="inline-flex items-center gap-1 font-medium text-text-primary hover:text-accent transition-colors"
                            title={isExpanded ? "Collapse" : "View members"}
                        >
                            {row.monthIndex}
                            <ExpandIcon className="w-3 h-3 text-text-secondary" />
                        </button>
                    );
                },
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
                    const isEditing = editMembersMode || editingRowMember === row.monthLabel;
                    const isLoading = savingCells.has(`member_${row.monthLabel}`);

                    if (isEditing) {
                        const isEditAllRowMode = editingRowMember !== null && editingRowPayout !== null;
                        const inputId = editingRowMember !== null ? `member_select_row_${row.monthLabel}` : `member_row_${rowIndex}`;

                        const handleKeyDown = (e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                if (isEditAllRowMode && row.payout) {
                                    const nextInput = document.getElementById(`payout_input_row_${row.payout.id}`);
                                    if (nextInput) nextInput.focus();
                                } else {
                                    handleSaveChanges();
                                }
                            }
                        };

                        return (
                            <div className="relative">
                                {isLoading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-background-primary/50 z-10">
                                        <Loader2 className="w-4 h-4 text-accent animate-spin" />
                                    </div>
                                )}
                                <select
                                    id={inputId}
                                    value={editedMembers[row.monthLabel] || ""}
                                    onChange={(e) => handleMemberChange(row.monthLabel, e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    disabled={isLoading}
                                    className="w-full min-w-[140px] px-2 py-1.5 text-sm bg-background-primary border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
                                >
                                    <option value="">Select member...</option>
                                    {allMembers.map((member) => (
                                        <option key={member.id} value={member.id}>
                                            {member.full_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        );
                    }
                    return row.assignment?.member ? (
                        <span className="text-text-primary">{row.assignment.member.full_name}</span>
                    ) : (
                        <span className="text-text-secondary">-</span>
                    );
                },
            },
            {
                header: "Payout",
                className: "text-center",
                headerClassName: "text-center",
                cell: (row, rowIndex) => {
                    const payoutKey = row.payout?.id ?? `month_${row.monthIndex}`;
                    const isEditing = editPayoutsMode || editingRowPayout === payoutKey;
                    const isLoading = savingCells.has(`payout_${payoutKey}`);

                    if (isEditing) {
                        const nextRowIndex = rowIndex + 1;
                        const isLastRowOnPage = rowIndex === paginatedData.length - 1;
                        const hasMorePages = currentPage < totalPages;
                        const isEditAllRowMode = editingRowPayout !== null && editingRowCollection !== null;
                        const hasNextRow = nextRowIndex < paginatedData.length;

                        const getNextInputId = () => {
                            if (isEditAllRowMode) {
                                if (isAuctionType) return `auction_input_row_${payoutKey}`;
                                return `collection_input_row_${row.monthIndex}`;
                            }
                            if (editPayoutsMode) {
                                return hasNextRow ? `payout_row_${nextRowIndex}` : "";
                            }
                            return "";
                        };

                        // Only save on Enter if: 
                        // - Per-row edit mode (not column mode)
                        // - OR column mode AND last row AND no more pages
                        const shouldSaveOnEnter = (!isEditAllRowMode && !editPayoutsMode) ||
                            (editPayoutsMode && isLastRowOnPage && !hasMorePages);

                        // Pass pagination handler if more pages exist
                        const shouldPaginate = editPayoutsMode && isLastRowOnPage && hasMorePages;

                        return (
                            <FormattedCurrencyInput
                                value={editedPayouts[payoutKey] ?? row.payout?.payout_amount?.toString() ?? ""}
                                onChange={(val) => handlePayoutChange(payoutKey, val)}
                                className="min-w-[120px]"
                                inputId={editingRowPayout !== null ? `payout_input_row_${payoutKey}` : `payout_row_${rowIndex}`}
                                nextInputId={getNextInputId()}
                                isLastRow={isLastRowOnPage}
                                onNextPage={shouldPaginate ? handleNextPageFocus : null}
                                columnPrefix="payout"
                                onEnterSubmit={shouldSaveOnEnter ? handleSaveChanges : null}
                                isLoading={isLoading}
                            />
                        );
                    }
                    return (
                        <span className={row.payout?.payout_amount > 0 ? "text-text-primary" : "text-text-secondary"}>
                            {row.payout?.payout_amount > 0
                                ? `₹${formatAmount(row.payout.payout_amount)}`
                                : "-"}
                        </span>
                    );
                },
            },
        ];

        // Auction column for auction-type chits
        if (isAuctionType) {
            baseColumns.push({
                header: "Auction",
                className: "text-center",
                headerClassName: "text-center",
                cell: (row, rowIndex) => {
                    const auctionKey = row.payout?.id ?? `month_${row.monthIndex}`;
                    const isEditing = editAuctionsMode || editingRowAuction === auctionKey;
                    const isLoading = savingCells.has(`auction_${auctionKey}`);

                    if (isEditing) {
                        const nextRowIndex = rowIndex + 1;
                        const isLastRowOnPage = rowIndex === paginatedData.length - 1;
                        const hasMorePages = currentPage < totalPages;
                        const isEditAllRowMode = editingRowAuction !== null && editingRowCollection !== null;
                        const hasNextRow = nextRowIndex < paginatedData.length;

                        const getNextInputId = () => {
                            if (isEditAllRowMode) return `collection_input_row_${row.monthIndex}`;
                            if (editAuctionsMode) {
                                return hasNextRow ? `auction_row_${nextRowIndex}` : "";
                            }
                            return "";
                        };

                        // Only save on Enter if no more pages
                        const shouldSaveOnEnter = (!isEditAllRowMode && !editAuctionsMode) ||
                            (editAuctionsMode && isLastRowOnPage && !hasMorePages);

                        const shouldPaginate = editAuctionsMode && isLastRowOnPage && hasMorePages;

                        return (
                            <FormattedCurrencyInput
                                value={editedAuctions[auctionKey] ?? row.payout?.bid_amount?.toString() ?? ""}
                                onChange={(val) => handleAuctionChange(auctionKey, val)}
                                className="min-w-[120px]"
                                inputId={editingRowAuction !== null ? `auction_input_row_${auctionKey}` : `auction_row_${rowIndex}`}
                                nextInputId={getNextInputId()}
                                isLastRow={isLastRowOnPage}
                                onNextPage={shouldPaginate ? handleNextPageFocus : null}
                                columnPrefix="auction"
                                onEnterSubmit={shouldSaveOnEnter ? handleSaveChanges : null}
                                isLoading={isLoading}
                            />
                        );
                    }
                    return (
                        <span className={row.bidAmount != null ? "text-text-primary" : "text-text-secondary"}>
                            {row.bidAmount != null ? `₹${formatAmount(row.bidAmount)}` : "-"}
                        </span>
                    );
                },
            });
        }

        // Collection column
        baseColumns.push({
            header: "Collection",
            className: "text-center",
            headerClassName: "text-center",
            cell: (row, rowIndex) => {
                const isEditing = editCollectionsMode || editingRowCollection === row.monthIndex;
                const collectionKey = `month_${row.monthIndex}`;
                const isLoading = savingCells.has(`collection_${collectionKey}`);

                if (isEditing) {
                    const nextRowIndex = rowIndex + 1;
                    const isLastRowOnPage = rowIndex === paginatedData.length - 1;
                    const hasMorePages = currentPage < totalPages;
                    const isEditAllRowMode = editingRowCollection !== null && !editCollectionsMode;
                    const hasNextRow = nextRowIndex < paginatedData.length;

                    // Only save on Enter if no more pages
                    const shouldSaveOnEnter = isEditAllRowMode ||
                        (editCollectionsMode && isLastRowOnPage && !hasMorePages);

                    const shouldPaginate = editCollectionsMode && isLastRowOnPage && hasMorePages;

                    return (
                        <FormattedCurrencyInput
                            value={editedCollections[collectionKey] ?? row.expectedAmount?.toString() ?? ""}
                            onChange={(val) => handleCollectionChange(collectionKey, val)}
                            className="min-w-[120px]"
                            inputId={isEditAllRowMode ? `collection_input_row_${row.monthIndex}` : `collection_row_${rowIndex}`}
                            nextInputId={editCollectionsMode && hasNextRow ? `collection_row_${nextRowIndex}` : ""}
                            isLastRow={isLastRowOnPage}
                            onNextPage={shouldPaginate ? handleNextPageFocus : null}
                            columnPrefix="collection"
                            onEnterSubmit={shouldSaveOnEnter ? handleSaveChanges : null}
                            isLoading={isLoading}
                        />
                    );
                }
                return (
                    <span className={row.expectedAmount > 0 ? "text-text-primary" : "text-text-secondary"}>
                        {row.expectedAmount > 0 ? `₹${formatAmount(row.expectedAmount)}` : "-"}
                    </span>
                );
            },
        });

        // Actions column
        if (mode !== "view" && !isColumnEditMode) {
            baseColumns.push({
                header: "Actions",
                className: "text-center",
                headerClassName: "text-center",
                cell: (row) => {
                    // Use same key format as inline edit handlers
                    const payoutKey = row.payout?.id ?? `month_${row.monthIndex}`;
                    const isThisRowEditing =
                        editingRowMember === row.monthLabel ||
                        editingRowPayout === payoutKey ||
                        editingRowAuction === payoutKey ||
                        editingRowCollection === row.monthIndex;

                    if (isThisRowEditing) {
                        return (
                            <div className="flex items-center justify-center space-x-1">
                                <button
                                    type="button"
                                    tabIndex={-1}
                                    onClick={handleCancelRowEdit}
                                    className="p-1.5 text-sm rounded-md text-error-accent hover:bg-error-accent hover:text-white transition-colors duration-200"
                                    title="Cancel"
                                    disabled={isSaving}
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    tabIndex={-1}
                                    onClick={handleSaveChanges}
                                    className="p-1.5 text-sm rounded-md text-success-accent hover:bg-success-accent hover:text-white transition-colors duration-200"
                                    title="Save"
                                    disabled={isSaving}
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                </button>
                            </div>
                        );
                    }

                    if (!isPerRowEditMode) {
                        return (
                            <div className="flex items-center justify-center space-x-1">
                                <button
                                    type="button"
                                    onClick={() => handleEnterRowAllEdit(row)}
                                    className="p-1.5 text-sm rounded-md text-accent hover:bg-accent hover:text-white transition-colors duration-200"
                                    title="Edit Row"
                                >
                                    <SquarePen className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleEnterRowMemberEdit(row)}
                                    className="p-1.5 text-sm rounded-md text-warning-accent hover:bg-warning-accent hover:text-white transition-colors duration-200"
                                    title="Assign Member"
                                >
                                    <UserPlus className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleEnterRowPayoutEdit(row)}
                                    className="p-1.5 text-sm rounded-md text-warning-accent hover:bg-warning-accent hover:text-white transition-colors duration-200"
                                    title="Edit Payout"
                                >
                                    <TrendingUp className="w-4 h-4" />
                                </button>
                                {isAuctionType && (
                                    <button
                                        type="button"
                                        onClick={() => handleEnterRowAuctionEdit(row)}
                                        className="p-1.5 text-sm rounded-md text-warning-accent hover:bg-warning-accent hover:text-white transition-colors duration-200"
                                        title="Edit Auction"
                                    >
                                        <Gavel className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => handleEnterRowCollectionEdit(row)}
                                    className="p-1.5 text-sm rounded-md text-warning-accent hover:bg-warning-accent hover:text-white transition-colors duration-200"
                                    title="Edit Collection"
                                >
                                    <WalletMinimal className="w-4 h-4" />
                                </button>
                            </div>
                        );
                    }

                    return null;
                },
            });
        }

        return baseColumns;
    }, [
        mode, isAnyEditMode, isColumnEditMode, isPerRowEditMode,
        editMembersMode, editPayoutsMode, editAuctionsMode, editCollectionsMode,
        editingRowMember, editingRowPayout, editingRowAuction, editingRowCollection,
        isAuctionType, editedMembers, editedPayouts, editedAuctions, editedCollections,
        allMembers, paginatedData, currentPage, totalPages, isSaving, savingCells,
        expandedMonth,
    ]);

    // --- Render Content ---
    const renderContent = () => {
        if (view === "new") {
            return (
                <AssignNewMemberForm
                    ref={formRef}
                    onMemberCreated={() => {
                        refetchAssignments();
                        refetchMonths();
                    }}
                    onMemberNameChange={setActiveMemberName}
                    onBackToList={() => handleViewChange("list")}
                />
            );
        }


        return (
            <>
                {/* Action Buttons (when not editing) */}
                {mode !== "view" && !isAnyEditMode && (
                    <div className="mb-4">
                        <div className="flex gap-2">
                            <Button onClick={handleEnterEditMode} className="w-full flex items-center justify-center" size="sm">
                                <SquarePen className="w-4 h-4 mr-1.5" />
                                <span>Edit All</span>
                            </Button>
                        </div>
                        {/* Quick Action Toolbar */}
                        <div className="mt-3 p-3 bg-background-secondary rounded-xl shadow-sm border border-border">
                            <div className="flex items-center justify-center gap-2 sm:gap-3">
                                <div className="flex items-center justify-center gap-2 sm:gap-3">
                                    <span className="hidden sm:inline text-xs text-text-secondary font-medium mr-1">Members</span>
                                    <button type="button" onClick={() => handleViewChange("new")} className="p-2 sm:p-2.5 rounded-full bg-success-bg text-success-accent hover:bg-success-accent hover:text-white hover:scale-110 transition-all duration-200 shadow-sm" title="New Member">
                                        <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </button>
                                </div>
                                <div className="h-6 sm:h-8 w-px bg-border"></div>
                                <div className="flex items-center justify-center gap-2 sm:gap-3">
                                    <span className="hidden sm:inline text-xs text-text-secondary font-medium mr-1">Edit</span>
                                    <button type="button" onClick={handleEnterMembersEditMode} className="p-2 sm:p-2.5 rounded-full bg-warning-bg text-warning-accent hover:bg-warning-accent hover:text-white hover:scale-110 transition-all duration-200 shadow-sm" title="Edit All Members">
                                        <User className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </button>
                                    <button type="button" onClick={handleEnterPayoutsEditMode} className="p-2 sm:p-2.5 rounded-full bg-warning-bg text-warning-accent hover:bg-warning-accent hover:text-white hover:scale-110 transition-all duration-200 shadow-sm" title="Edit All Payouts">
                                        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </button>
                                    {isAuctionType && (
                                        <button type="button" onClick={handleEnterAuctionsEditMode} className="p-2 sm:p-2.5 rounded-full bg-warning-bg text-warning-accent hover:bg-warning-accent hover:text-white hover:scale-110 transition-all duration-200 shadow-sm" title="Edit All Auctions">
                                            <Gavel className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </button>
                                    )}
                                    <button type="button" onClick={handleEnterCollectionsEditMode} className="p-2 sm:p-2.5 rounded-full bg-warning-bg text-warning-accent hover:bg-warning-accent hover:text-white hover:scale-110 transition-all duration-200 shadow-sm" title="Edit All Collections">
                                        <WalletMinimal className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Mode Buttons */}
                {isColumnEditMode && (
                    <div className="mb-4">
                        <div className="flex justify-between gap-3">
                            <Button onClick={handleCancelEditMode} variant="error" className="flex items-center justify-center" size="sm" disabled={isSaving}>
                                <X className="w-4 h-4 mr-1.5" />
                                <span>Cancel</span>
                            </Button>
                            <Button onClick={handleSaveChanges} variant="success" className="flex items-center justify-center" size="sm" disabled={isSaving}>
                                {isSaving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Check className="w-4 h-4 mr-1.5" />}
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
                        {/* Search & Filter (hide in edit mode) */}
                        {!isAnyEditMode && (
                            <div className="mb-3 flex flex-col gap-3">
                                {/* Search Bar */}
                                <div className="relative flex items-center">
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

                                {/* Filter Chips */}
                                <div className="flex overflow-x-auto gap-2 no-scrollbar">
                                    <button
                                        type="button"
                                        onClick={() => setStatusFilter(null)}
                                        className={`${chipBaseClass} ${statusFilter === null ? chipSelectedClass : chipUnselectedClass}`}
                                    >
                                        All
                                    </button>
                                    {FILTER_OPTIONS.filter((option) =>
                                        !option.value.startsWith("auctions") || isAuctionType
                                    ).map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => setStatusFilter(option.value)}
                                            className={`${chipBaseClass} ${statusFilter === option.value ? chipSelectedClass : chipUnselectedClass}`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* Empty State */}
                        {filteredData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 px-4">
                                <div className="w-16 h-16 mb-4 rounded-full bg-background-secondary flex items-center justify-center">
                                    <Search className="w-8 h-8 text-text-secondary" />
                                </div>
                                <p className="text-text-secondary text-center text-sm">
                                    No months match your filter criteria
                                </p>
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
                            </div>
                        ) : (
                            <>
                                {/* Table */}
                                <div className="block">
                                    <Table
                                        columns={columns}
                                        data={paginatedData}
                                        variant="secondary"
                                        expandedRowRender={(row) => expandedMonth === row.monthIndex ? (
                                            <MonthMemberBreakdown
                                                chitId={chitId}
                                                month={row.monthIndex}
                                                monthLabel={row.monthLabel}
                                                onClose={() => setExpandedMonth(null)}
                                                onLogPayment={onLogCollectionClick ? (member) => onLogCollectionClick({
                                                    ...member,
                                                    month: row.monthIndex,
                                                    collectionId: row.collection?.id,
                                                }) : null}
                                            />
                                        ) : null}
                                    />
                                </div>

                                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                            </>
                        )}
                    </>
                )}
            </>
        );
    };

    // --- Header ---
    const getHeaderTitle = () => {
        if (activeMemberName) return activeMemberName;
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
            {error && <Message type="error" onClose={() => setLocalError(null)}>{error}</Message>}

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
