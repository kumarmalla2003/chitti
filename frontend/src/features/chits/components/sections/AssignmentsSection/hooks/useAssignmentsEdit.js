// frontend/src/features/chits/components/sections/AssignmentsSection/hooks/useAssignmentsEdit.js

import { useState, useMemo, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createAssignment, deleteAssignment } from "../../../../../../services/assignmentsService";
import { updatePayout } from "../../../../../../services/payoutsService";
import { collectionKeys } from "../../../../../collections/hooks/useCollections";

/**
 * Custom hook for managing all edit state, optimistic updates, and save operations
 * for the AssignmentsSection.
 */
export const useAssignmentsEdit = ({
    chitId,
    chitDetails,
    allMonthsData,
    payouts,
    allMembers,
    isAuctionType,
    refetchAssignments,
    refetchMonths,
    refetchPayouts,
}) => {
    const queryClient = useQueryClient();

    // Column-level edit modes
    const [editMembersMode, setEditMembersMode] = useState(false);
    const [editPayoutsMode, setEditPayoutsMode] = useState(false);
    const [editAuctionsMode, setEditAuctionsMode] = useState(false);
    const [editCollectionsMode, setEditCollectionsMode] = useState(false);

    // Per-row edit states
    const [editingRowMember, setEditingRowMember] = useState(null);
    const [editingRowPayout, setEditingRowPayout] = useState(null);
    const [editingRowAuction, setEditingRowAuction] = useState(null);
    const [editingRowCollection, setEditingRowCollection] = useState(null);

    // Edited data stores
    const [editedMembers, setEditedMembers] = useState({});
    const [editedPayouts, setEditedPayouts] = useState({});
    const [editedAuctions, setEditedAuctions] = useState({});
    const [editedCollections, setEditedCollections] = useState({});

    // Per-cell loading states (Set of cell keys)
    const [savingCells, setSavingCells] = useState(new Set());
    const [isSaving, setIsSaving] = useState(false);

    // Optimistic data for rollback
    const previousDataRef = useRef(null);

    // Derived states
    const isColumnEditMode = editMembersMode || editPayoutsMode || editAuctionsMode || editCollectionsMode;
    const isPerRowEditMode = editingRowMember !== null || editingRowPayout !== null || editingRowAuction !== null || editingRowCollection !== null;
    const isAnyEditMode = isColumnEditMode || isPerRowEditMode;

    // --- Enter Edit Mode Handlers (Column-level) ---
    const handleEnterMembersEditMode = useCallback(() => {
        const memberEdits = {};
        allMonthsData.forEach((row) => {
            if (row.assignment?.member?.id) {
                memberEdits[row.monthLabel] = row.assignment.member.id.toString();
            }
        });
        setEditedMembers(memberEdits);
        setEditMembersMode(true);
        setTimeout(() => {
            const input = document.getElementById("member_row_0");
            if (input) input.focus();
        }, 100);
    }, [allMonthsData]);

    const handleEnterPayoutsEditMode = useCallback(() => {
        const payoutEdits = {};
        payouts.forEach((p) => {
            payoutEdits[p.id] = p.payout_amount?.toString() || "";
        });
        setEditedPayouts(payoutEdits);
        setEditPayoutsMode(true);
        setTimeout(() => {
            const input = document.getElementById("payout_row_0");
            if (input) input.focus();
        }, 100);
    }, [payouts]);

    const handleEnterAuctionsEditMode = useCallback(() => {
        const auctionEdits = {};
        payouts.forEach((p) => {
            auctionEdits[p.id] = p.bid_amount?.toString() || "";
        });
        setEditedAuctions(auctionEdits);
        setEditAuctionsMode(true);
        setTimeout(() => {
            const input = document.getElementById("auction_row_0");
            if (input) input.focus();
        }, 100);
    }, [payouts]);

    const handleEnterCollectionsEditMode = useCallback(() => {
        const collectionEdits = {};
        allMonthsData.forEach((row) => {
            collectionEdits[`month_${row.monthIndex}`] = row.expectedAmount?.toString() || "";
        });
        setEditedCollections(collectionEdits);
        setEditCollectionsMode(true);
        setTimeout(() => {
            const input = document.getElementById("collection_row_0");
            if (input) input.focus();
        }, 100);
    }, [allMonthsData]);

    const handleEnterEditMode = useCallback(() => {
        handleEnterMembersEditMode();
        handleEnterPayoutsEditMode();
        if (isAuctionType) handleEnterAuctionsEditMode();
        handleEnterCollectionsEditMode();
        setTimeout(() => {
            const input = document.getElementById("member_row_0");
            if (input) input.focus();
        }, 150);
    }, [handleEnterMembersEditMode, handleEnterPayoutsEditMode, handleEnterAuctionsEditMode, handleEnterCollectionsEditMode, isAuctionType]);

    // --- Per-Row Edit Handlers ---
    const handleEnterRowMemberEdit = useCallback((row) => {
        if (row.assignment?.member?.id) {
            setEditedMembers({ [row.monthLabel]: row.assignment.member.id.toString() });
        } else {
            setEditedMembers({ [row.monthLabel]: "" });
        }
        setEditingRowMember(row.monthLabel);
        setTimeout(() => {
            const input = document.getElementById(`member_select_row_${row.monthLabel}`);
            if (input) input.focus();
        }, 100);
    }, []);

    const handleEnterRowPayoutEdit = useCallback((row) => {
        const payoutKey = row.payout?.id ?? `month_${row.monthIndex}`;
        setEditedPayouts({ [payoutKey]: row.payout?.payout_amount?.toString() || "" });
        setEditingRowPayout(payoutKey);
        setTimeout(() => {
            const input = document.getElementById(`payout_input_row_${payoutKey}`);
            if (input) input.focus();
        }, 100);
    }, []);

    const handleEnterRowAuctionEdit = useCallback((row) => {
        const auctionKey = row.payout?.id ?? `month_${row.monthIndex}`;
        setEditedAuctions({ [auctionKey]: row.payout?.bid_amount?.toString() || "" });
        setEditingRowAuction(auctionKey);
        setTimeout(() => {
            const input = document.getElementById(`auction_input_row_${auctionKey}`);
            if (input) input.focus();
        }, 100);
    }, []);

    const handleEnterRowCollectionEdit = useCallback((row) => {
        const collectionKey = `month_${row.monthIndex}`;
        setEditedCollections({ [collectionKey]: row.expectedAmount?.toString() || "" });
        setEditingRowCollection(row.monthIndex);
        setTimeout(() => {
            const input = document.getElementById(`collection_input_row_${row.monthIndex}`);
            if (input) input.focus();
        }, 100);
    }, []);

    const handleEnterRowAllEdit = useCallback((row) => {
        if (row.assignment?.member?.id) {
            setEditedMembers({ [row.monthLabel]: row.assignment.member.id.toString() });
        } else {
            setEditedMembers({ [row.monthLabel]: "" });
        }
        setEditingRowMember(row.monthLabel);

        // Use monthIndex as fallback key when payout doesn't exist
        const payoutKey = row.payout?.id ?? `month_${row.monthIndex}`;
        setEditedPayouts({ [payoutKey]: row.payout?.payout_amount?.toString() || "" });
        setEditingRowPayout(payoutKey);

        if (isAuctionType) {
            setEditedAuctions({ [payoutKey]: row.payout?.bid_amount?.toString() || "" });
            setEditingRowAuction(payoutKey);
        }

        const collectionKey = `month_${row.monthIndex}`;
        setEditedCollections({ [collectionKey]: row.expectedAmount?.toString() || "" });
        setEditingRowCollection(row.monthIndex);
        setTimeout(() => {
            const input = document.getElementById(`member_select_row_${row.monthLabel}`);
            if (input) input.focus();
        }, 100);
    }, [isAuctionType]);

    // --- Cancel Handlers ---
    const handleCancelRowEdit = useCallback(() => {
        setEditingRowMember(null);
        setEditingRowPayout(null);
        setEditingRowAuction(null);
        setEditingRowCollection(null);
        setEditedMembers({});
        setEditedPayouts({});
        setEditedAuctions({});
        setEditedCollections({});
    }, []);

    const handleCancelEditMode = useCallback(() => {
        setEditMembersMode(false);
        setEditPayoutsMode(false);
        setEditAuctionsMode(false);
        setEditCollectionsMode(false);
        setEditingRowMember(null);
        setEditingRowPayout(null);
        setEditingRowAuction(null);
        setEditingRowCollection(null);
        setEditedMembers({});
        setEditedPayouts({});
        setEditedAuctions({});
        setEditedCollections({});
    }, []);

    // --- Value Change Handlers ---
    const handleMemberChange = useCallback((monthLabel, memberId) => {
        setEditedMembers((prev) => ({ ...prev, [monthLabel]: memberId }));
    }, []);

    const handlePayoutChange = useCallback((payoutId, amount) => {
        setEditedPayouts((prev) => ({ ...prev, [payoutId]: amount }));
    }, []);

    const handleAuctionChange = useCallback((payoutId, amount) => {
        setEditedAuctions((prev) => ({ ...prev, [payoutId]: amount }));
    }, []);

    const handleCollectionChange = useCallback((collectionId, amount) => {
        setEditedCollections((prev) => ({ ...prev, [collectionId]: amount }));
    }, []);

    // --- Month label to ISO date helper ---
    const monthLabelToISODate = useCallback((monthLabel) => {
        if (!chitDetails?.start_date) return null;
        const [month, year] = monthLabel.split("/");
        const d = new Date(chitDetails.start_date);
        d.setFullYear(parseInt(year));
        d.setMonth(parseInt(month) - 1);
        return d.toISOString().split("T")[0];
    }, [chitDetails]);

    // --- Save Changes with Optimistic Updates ---
    const handleSaveChanges = useCallback(async () => {
        setIsSaving(true);

        // Store previous data for potential rollback
        previousDataRef.current = {
            editedMembers: { ...editedMembers },
            editedPayouts: { ...editedPayouts },
            editedAuctions: { ...editedAuctions },
            editedCollections: { ...editedCollections },
        };

        const savingSet = new Set();
        const errors = [];

        try {
            const promises = [];

            // 1. Process member assignments (only for rows that were actually edited)
            for (const row of allMonthsData) {
                // Skip if this row's member wasn't edited
                if (!(row.monthLabel in editedMembers)) continue;

                const newMemberId = editedMembers[row.monthLabel];
                const currentMemberId = row.assignment?.member?.id?.toString();

                // Only process if the value actually changed
                if (newMemberId !== currentMemberId) {
                    savingSet.add(`member_${row.monthLabel}`);

                    // Delete existing assignment only if there was a member assigned before
                    // deleteAssignment expects (chitId, month) not just an ID
                    if (currentMemberId && row.monthIndex && newMemberId !== currentMemberId) {
                        promises.push(
                            deleteAssignment(chitId, row.monthIndex).catch((err) => {
                                errors.push(`Failed to delete assignment: ${err.message}`);
                            })
                        );
                    }
                    // Create new assignment if a member was selected
                    if (newMemberId && newMemberId !== "" && row.monthIndex) {
                        promises.push(
                            // createAssignment expects (chitId, month, memberId)
                            createAssignment(chitId, row.monthIndex, parseInt(newMemberId)).catch((err) => {
                                errors.push(`Failed to create assignment: ${err.message}`);
                            })
                        );
                    }
                }
            }

            // 2. Process payout changes
            for (const [payoutKey, newAmount] of Object.entries(editedPayouts)) {
                // Handle both numeric slot IDs and month_X string keys
                let originalPayout;
                if (payoutKey.startsWith('month_')) {
                    const monthNum = parseInt(payoutKey.replace('month_', ''));
                    originalPayout = payouts.find((p) => p.month === monthNum);
                } else {
                    originalPayout = payouts.find((p) => p.id === parseInt(payoutKey));
                }

                if (originalPayout) {
                    // Empty string → null (not entered), otherwise parse as number
                    const newAmountNum = newAmount.trim() === "" ? null : (parseFloat(newAmount) || 0);
                    if (originalPayout.payout_amount !== newAmountNum) {
                        savingSet.add(`payout_${payoutKey}`);
                        promises.push(
                            updatePayout(originalPayout.id, { payout_amount: newAmountNum }).catch((err) => {
                                errors.push(`Failed to update payout: ${err.message}`);
                            })
                        );
                    }
                }
            }

            // 3. Process auction changes
            if (isAuctionType) {
                for (const [auctionKey, newBidAmount] of Object.entries(editedAuctions)) {
                    // Handle both numeric slot IDs and month_X string keys
                    let originalPayout;
                    if (auctionKey.startsWith('month_')) {
                        const monthNum = parseInt(auctionKey.replace('month_', ''));
                        originalPayout = payouts.find((p) => p.month === monthNum);
                    } else {
                        originalPayout = payouts.find((p) => p.id === parseInt(auctionKey));
                    }

                    if (originalPayout) {
                        // Empty string → null (not entered), otherwise parse as number
                        const newBidNum = newBidAmount.trim() === "" ? null : (parseFloat(newBidAmount) || 0);
                        if (originalPayout.bid_amount !== newBidNum) {
                            savingSet.add(`auction_${auctionKey}`);
                            promises.push(
                                updatePayout(originalPayout.id, { bid_amount: newBidNum }).catch((err) => {
                                    errors.push(`Failed to update auction: ${err.message}`);
                                })
                            );
                        }
                    }
                }
            }

            // 4. Process collection changes (expected_contribution stored in slots)
            for (const [collectionKey, newAmount] of Object.entries(editedCollections)) {
                // Collection keys are always month_X format
                const monthNum = parseInt(collectionKey.replace('month_', ''));
                const originalSlot = payouts.find((p) => p.month === monthNum);

                if (originalSlot) {
                    // Empty string → null (not entered), otherwise parse as number
                    const newAmountNum = newAmount.trim() === "" ? null : (parseFloat(newAmount) || 0);
                    if (originalSlot.expected_contribution !== newAmountNum) {
                        savingSet.add(`collection_${collectionKey}`);
                        promises.push(
                            updatePayout(originalSlot.id, { expected_contribution: newAmountNum }).catch((err) => {
                                errors.push(`Failed to update collection: ${err.message}`);
                            })
                        );
                    }
                }
            }

            setSavingCells(savingSet);
            await Promise.all(promises);

            // Refresh data
            await Promise.all([
                refetchAssignments(),
                refetchMonths(),
                refetchPayouts(),
                queryClient.invalidateQueries({ queryKey: collectionKeys.byChit(chitId) }),
            ]);

            handleCancelEditMode();

            if (errors.length > 0) {
                return { success: false, error: errors.join(", ") };
            }
            return { success: true, message: "Changes saved successfully!" };
        } catch (err) {
            // Rollback is handled by parent component if needed
            return { success: false, error: err.message || "Failed to save changes" };
        } finally {
            setIsSaving(false);
            setSavingCells(new Set());
        }
    }, [
        chitId, allMonthsData, editedMembers, editedPayouts, editedAuctions, editedCollections,
        payouts, isAuctionType, monthLabelToISODate,
        refetchAssignments, refetchMonths, refetchPayouts, queryClient, handleCancelEditMode
    ]);

    return {
        // Edit mode states
        editMembersMode,
        editPayoutsMode,
        editAuctionsMode,
        editCollectionsMode,
        editingRowMember,
        editingRowPayout,
        editingRowAuction,
        editingRowCollection,
        isColumnEditMode,
        isPerRowEditMode,
        isAnyEditMode,

        // Edited data
        editedMembers,
        editedPayouts,
        editedAuctions,
        editedCollections,

        // Loading states
        isSaving,
        savingCells,

        // Handlers - Column Edit
        handleEnterMembersEditMode,
        handleEnterPayoutsEditMode,
        handleEnterAuctionsEditMode,
        handleEnterCollectionsEditMode,
        handleEnterEditMode,

        // Handlers - Row Edit
        handleEnterRowMemberEdit,
        handleEnterRowPayoutEdit,
        handleEnterRowAuctionEdit,
        handleEnterRowCollectionEdit,
        handleEnterRowAllEdit,

        // Handlers - Cancel
        handleCancelRowEdit,
        handleCancelEditMode,

        // Handlers - Value Change
        handleMemberChange,
        handlePayoutChange,
        handleAuctionChange,
        handleCollectionChange,

        // Handlers - Save
        handleSaveChanges,
    };
};

export default useAssignmentsEdit;
