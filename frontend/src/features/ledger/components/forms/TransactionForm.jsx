// frontend/src/features/ledger/components/forms/TransactionForm.jsx

import { useState, useEffect, useMemo } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
    Calendar,
    CreditCard,
    FileText,
    Layers,
    User,
    WalletMinimal,
    TrendingUp,
    Save,
    SquarePen,
    Loader2,
} from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { getAllChits } from "../../../../services/chitsService";
import { getAllMembers } from "../../../../services/membersService";
import { getAssignmentsForMember, getAssignmentsForChit } from "../../../../services/assignmentsService";
import { createPayment, updatePayment, getPaymentById } from "../../../../services/paymentsService";
import { updatePayout } from "../../../../services/payoutsService";

import Message from "../../../../components/ui/Message";
import Button from "../../../../components/ui/Button";
import FormattedInput from "../../../../components/ui/FormattedInput";
import CustomDateInput from "../../../../components/ui/CustomDateInput";

// Schema for Collection - now uses slot_id (member's assigned payout slot) + collection_month
const collectionSchema = z.object({
    member_id: z.string().min(1, "Member is required"),
    chit_id: z.string().min(1, "Chit is required"),
    slot_id: z.coerce.number({ invalid_type_error: "Please select an assignment" }).int().positive("Please select an assignment"),
    collection_month: z.coerce.number({ invalid_type_error: "Please select a month" }).int().positive("Please select a month"),
    amount_paid: z.coerce.number({ invalid_type_error: "Amount must be a number" }).positive("Amount must be positive"),
    collection_date: z.string().min(1, "Date is required"),
    collection_method: z.string().min(1, "Method is required"),
    notes: z.string().optional().nullable(),
});

// Schema for Payout
const payoutSchema = z.object({
    chit_id: z.string().min(1, "Chit is required"),
    member_id: z.string().min(1, "Member is required"),
    chit_assignment_id: z.string().min(1, "Winning month is required"),
    amount: z.coerce.number({ invalid_type_error: "Amount must be a number" }).positive("Amount must be positive"),
    paid_date: z.string().min(1, "Date is required"),
    method: z.string().min(1, "Method is required"),
    notes: z.string().optional().nullable(),
});

const TransactionForm = ({
    initialType = "collection",
    initialChitId,
    initialMemberId,
    transactionId,
    initialData,
    onSuccess,
    onCancel,
    onTypeChange,
    disabled = false,
}) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [transactionType, setTransactionType] = useState(initialType);
    const [submitError, setSubmitError] = useState(null);

    // Sync with parent if needed
    useEffect(() => {
        if (onTypeChange) {
            onTypeChange(transactionType);
        }
    }, [transactionType, onTypeChange]);

    // Initial values based on type
    const defaultValues = useMemo(() => {
        if (initialData) return initialData;
        return transactionType === "collection" ? {
            member_id: initialMemberId || "",
            chit_id: initialChitId || "",
            slot_id: "",  // Member's assigned payout slot
            collection_month: "",  // Which month's collection (1 to duration)
            amount_paid: "",
            collection_date: new Date().toISOString().split("T")[0],
            collection_method: "cash",
            notes: "",
        } : {
            chit_id: initialChitId || "",
            member_id: initialMemberId || "",
            chit_assignment_id: "",
            amount: "",
            paid_date: new Date().toISOString().split("T")[0],
            method: "cash",
            notes: "",
        };
    }, [initialData, initialChitId, initialMemberId, transactionType]);

    const {
        register,
        control,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(transactionType === "collection" ? collectionSchema : payoutSchema),
        defaultValues,
    });

    // Reset form when type changes (if not editing existing)
    useEffect(() => {
        if (!transactionId) {
            reset(defaultValues);
        }
    }, [transactionType, defaultValues, reset, transactionId]);

    // Fetch existing payment data for edit mode
    const [loadingExisting, setLoadingExisting] = useState(false);
    const [existingPayment, setExistingPayment] = useState(null);

    useEffect(() => {
        if (transactionId) {
            setLoadingExisting(true);
            getPaymentById(transactionId)
                .then((payment) => {
                    if (payment) {
                        setExistingPayment(payment);
                        // Determine type from payment
                        const type = payment.payment_type === 'payout' ? 'payout' : 'collection';
                        setTransactionType(type);
                    }
                })
                .catch(console.error)
                .finally(() => setLoadingExisting(false));
        }
    }, [transactionId]);

    // Data Loading State
    const [allChits, setAllChits] = useState([]);
    const [allMembers, setAllMembers] = useState([]);
    const [filteredChits, setFilteredChits] = useState([]);
    const [filteredMembers, setFilteredMembers] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(false);

    // Watch fields for cascading logic
    const selectedChitId = useWatch({ control, name: "chit_id" });
    const selectedMemberId = useWatch({ control, name: "member_id" });

    // 1. Fetch Basic Data (Chits & Members)
    useEffect(() => {
        const loadBasics = async () => {
            setIsLoadingData(true);
            try {
                const [chitsRes, membersRes] = await Promise.all([getAllChits(), getAllMembers()]);
                setAllChits(chitsRes.chits || []);
                setAllMembers(membersRes.members || []);
                setFilteredChits(chitsRes.chits || []);
                setFilteredMembers(membersRes.members || []);
            } catch (err) {
                console.error("Failed to load initial data", err);
                setSubmitError("Failed to load chits or members. Please refresh.");
            } finally {
                setIsLoadingData(false);
            }
        };
        loadBasics();
    }, []);

    // Apply existing payment data after allMembers is loaded
    // Split into two effects: (1) set basic fields, (2) set slot_id after memberSlots are ready
    const [pendingSlotId, setPendingSlotId] = useState(null);
    const [pendingCollectionMonth, setPendingCollectionMonth] = useState(null);

    // 2. Member's Assigned Slots for the selected Chit+Member (for collections)
    const [memberAssignedSlots, setMemberAssignedSlots] = useState([]);
    const [selectedChitData, setSelectedChitData] = useState(null);

    useEffect(() => {
        if (existingPayment && allMembers.length > 0 && !isLoadingData) {
            const payment = existingPayment;
            const type = payment.payment_type === 'payout' ? 'payout' : 'collection';

            // Map backend fields to form fields
            const formData = type === 'collection' ? {
                member_id: String(payment.member_id || ''),
                chit_id: String(payment.chit_id || ''),
                slot_id: '', // Don't set slot_id yet - wait for memberSlots to load
                collection_month: '', // Don't set collection_month yet
                amount_paid: payment.amount || '',
                collection_date: payment.date || new Date().toISOString().split('T')[0],
                collection_method: payment.method || 'cash',
                notes: payment.notes || '',
            } : {
                chit_id: String(payment.chit_id || ''),
                member_id: String(payment.member_id || ''),
                chit_assignment_id: String(payment.slot_id || ''),
                amount: payment.amount || '',
                paid_date: payment.date || new Date().toISOString().split('T')[0],
                method: payment.method || 'cash',
                notes: payment.notes || '',
            };

            // Temporarily populate filtered members with all members to ensure the selected member exists 
            // and the form value isn't rejected by the select input
            setFilteredMembers(allMembers);

            // Store the slot_id and collection_month values to apply later when memberSlots are ready
            if (type === 'collection') {
                if (payment.slot_id) setPendingSlotId(String(payment.slot_id));
                if (payment.collection_month) setPendingCollectionMonth(String(payment.collection_month));
            }

            reset(formData);
        }
    }, [existingPayment, allMembers, isLoadingData, reset]);

    // Load member's assigned slots for the selected Chit+Member (for collections)
    useEffect(() => {
        if (transactionType === "collection" && selectedChitId && selectedMemberId) {
            const loadMemberSlots = async () => {
                try {
                    // Get member's assignments filtered by this chit
                    const res = await getAssignmentsForMember(selectedMemberId);
                    const slots = res?.slots ?? [];
                    // Filter to only slots for this chit
                    const chitSlots = slots.filter(s => s.chit && s.chit.id === parseInt(selectedChitId));
                    // Sort by month
                    const sortedSlots = [...chitSlots].sort((a, b) => a.month - b.month);
                    setMemberAssignedSlots(sortedSlots);

                    // Store chit data for date calculation
                    if (sortedSlots.length > 0 && sortedSlots[0].chit) {
                        setSelectedChitData(sortedSlots[0].chit);
                    }

                    // Auto-select if member has only 1 assignment
                    if (sortedSlots.length === 1) {
                        setValue('slot_id', String(sortedSlots[0].id));
                    }
                } catch (e) { console.error(e); }
            };
            loadMemberSlots();
        } else if (transactionType === "collection" && selectedChitId && !selectedMemberId) {
            // Clear member slots when member is cleared
            setMemberAssignedSlots([]);
            setValue('slot_id', '');
        } else {
            setMemberAssignedSlots([]);
            setSelectedChitData(null);
        }
    }, [transactionType, selectedChitId, selectedMemberId, setValue]);

    // Load chit data for duration_months (needed for collection_month dropdown)
    useEffect(() => {
        if (transactionType === "collection" && selectedChitId && !selectedChitData) {
            const loadChitData = async () => {
                try {
                    const res = await getAssignmentsForChit(selectedChitId);
                    if (res?.chit) {
                        setSelectedChitData(res.chit);
                    }
                } catch (e) { console.error(e); }
            };
            loadChitData();
        }
    }, [transactionType, selectedChitId, selectedChitData]);

    // Apply pending slot_id value once memberAssignedSlots are loaded
    useEffect(() => {
        if (pendingSlotId && memberAssignedSlots.length > 0) {
            // Check if the pending slot exists in the available slots
            const slotExists = memberAssignedSlots.some(slot => String(slot.id) === pendingSlotId);
            if (slotExists) {
                setValue('slot_id', pendingSlotId);
            }
            setPendingSlotId(null); // Clear the pending value
        }
    }, [pendingSlotId, memberAssignedSlots, setValue]);

    // Apply pending collection_month value
    useEffect(() => {
        if (pendingCollectionMonth && selectedChitData) {
            setValue('collection_month', pendingCollectionMonth);
            setPendingCollectionMonth(null);
        }
    }, [pendingCollectionMonth, selectedChitData, setValue]);

    // 3. Cascade: Filter Chits/Members based on selection
    useEffect(() => {
        if (selectedChitId) {
            const filterMembers = async () => {
                try {
                    const res = await getAssignmentsForChit(selectedChitId);
                    // API returns { slots: [...] }, each slot has a member object
                    const slots = res?.slots ?? [];
                    const chitMemberIds = new Set(slots.filter(s => s.member).map(s => s.member.id));

                    // In edit mode, always include the currently selected member
                    let filtered = allMembers.filter(m => chitMemberIds.has(m.id));
                    if (selectedMemberId) {
                        const currentMember = allMembers.find(m => m.id === parseInt(selectedMemberId));
                        if (currentMember && !chitMemberIds.has(currentMember.id)) {
                            filtered = [currentMember, ...filtered];
                        }
                    }
                    setFilteredMembers(filtered);
                } catch (e) { console.error(e); }
            };
            filterMembers();
        } else {
            setFilteredMembers(allMembers);
        }
    }, [selectedChitId, allMembers, selectedMemberId]);

    useEffect(() => {
        if (selectedMemberId && !selectedChitId) {
            const filterChits = async () => {
                try {
                    const res = await getAssignmentsForMember(selectedMemberId);
                    // API returns { slots: [...] }, each slot has a chit object
                    const slots = res?.slots ?? [];
                    const memberChitIds = new Set(slots.filter(s => s.chit).map(s => s.chit.id));
                    setFilteredChits(allChits.filter(c => memberChitIds.has(c.id)));
                } catch (e) { console.error(e); }
            };
            filterChits();
        } else if (!selectedMemberId && !selectedChitId) {
            setFilteredChits(allChits);
        }
    }, [selectedMemberId, selectedChitId, allChits]);

    // 4. For Payouts: Load Winning Assignments (Eligible Slots)
    useEffect(() => {
        if (transactionType === "payout" && selectedChitId && selectedMemberId) {
            const loadAssignments = async () => {
                try {
                    const res = await getAssignmentsForMember(selectedMemberId);
                    // API returns { slots: [...] }, each slot has a chit object
                    const slots = res?.slots ?? [];
                    const chitAssignments = slots.filter(s => s.chit && s.chit.id === parseInt(selectedChitId));
                    setAssignments(chitAssignments);
                } catch (e) { console.error(e); }
            };
            loadAssignments();
        }
    }, [transactionType, selectedChitId, selectedMemberId]);

    // Mutation for submitting
    const mutation = useMutation({
        mutationFn: async (data) => {
            if (transactionType === "collection") {
                // Collection payload - includes slot_id (member's assignment) + collection_month
                const payload = {
                    amount: data.amount_paid, // Already coerced to number by zod
                    date: data.collection_date,
                    method: data.collection_method || "cash",
                    notes: data.notes || null,
                    payment_type: "collection",
                    slot_id: data.slot_id, // Member's assigned payout slot
                    collection_month: data.collection_month, // Which month's collection
                };
                if (transactionId) {
                    return updatePayment(transactionId, {
                        amount: typeof payload.amount === 'number' ? payload.amount : parseInt(payload.amount, 10),
                        date: payload.date,
                        method: payload.method,
                        notes: payload.notes
                    });
                } else {
                    return createPayment(payload);
                }
            } else {
                // For payouts: Simplified payload - only slot_id needed
                const payload = {
                    amount: data.amount, // Already coerced to number by zod
                    date: data.paid_date,
                    method: data.method || "cash",
                    notes: data.notes || null,
                    payment_type: "payout",
                    slot_id: parseInt(data.chit_assignment_id, 10),
                };
                if (transactionId) {
                    return updatePayment(transactionId, { amount: payload.amount, date: payload.date, method: payload.method, notes: payload.notes });
                } else {
                    return createPayment(payload);
                }
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["collections"] });
            queryClient.invalidateQueries({ queryKey: ["payouts"] });
            queryClient.invalidateQueries({ queryKey: ["ledger"] });

            if (onSuccess) {
                onSuccess();
            } else {
                navigate(-1);
            }
        },
        onError: (err) => {
            setSubmitError(err.message || "Transaction failed");
        }
    });

    const onSubmit = (data) => {
        setSubmitError(null);
        mutation.mutate(data);
    };

    return (
        <fieldset disabled={disabled || mutation.isPending} className="space-y-6">
            {/* Type Switcher - Matches SegmentedControl style */}
            {!transactionId && (
                <div className="flex justify-center mb-8">
                    <div className="flex gap-3" role="radiogroup">
                        {[
                            { value: "collection", label: "Collection", icon: WalletMinimal },
                            { value: "payout", label: "Payout", icon: TrendingUp },
                        ].map((option) => {
                            const isSelected = transactionType === option.value;
                            const Icon = option.icon;
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setTransactionType(option.value)}
                                    className={`
                                        relative flex items-center gap-2 px-6 py-2.5 rounded-full
                                        border-2 transition-all duration-200 select-none
                                        ${isSelected
                                            ? "bg-accent text-white border-accent shadow-md scale-[1.05]"
                                            : "bg-background-secondary text-text-secondary border-border hover:border-accent/50 hover:bg-accent/5"
                                        }
                                    `}
                                >
                                    <Icon className={`w-4 h-4 ${isSelected ? "text-white" : "text-text-secondary"}`} />
                                    <span className="font-bold text-sm">{option.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {submitError && <Message type="error">{submitError}</Message>}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* 1. Member & Chit Selection (Row) */}
                <div className="grid sm:grid-cols-2 gap-6">
                    {/* Chit */}
                    <div>
                        <label htmlFor="chit_id" className="block text-lg font-medium text-text-secondary mb-1">
                            Chit
                        </label>
                        <div className="relative flex items-center">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <Layers className="w-5 h-5 text-text-secondary" />
                            </span>
                            <div className="absolute left-10 h-6 w-px bg-border"></div>
                            <select
                                {...register("chit_id")}
                                id="chit_id"
                                className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 ${errors.chit_id ? "border-red-500" : "border-border"}`}
                                disabled={isLoadingData || loadingExisting}
                            >
                                <option value="">{isLoadingData ? "Loading..." : "Select a chit..."}</option>
                                {filteredChits.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        {errors.chit_id && <p className="text-red-500 text-sm mt-1">{errors.chit_id.message}</p>}
                    </div>

                    {/* Member */}
                    <div>
                        <label htmlFor="member_id" className="block text-lg font-medium text-text-secondary mb-1">
                            Member
                        </label>
                        <div className="relative flex items-center">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <User className="w-5 h-5 text-text-secondary" />
                            </span>
                            <div className="absolute left-10 h-6 w-px bg-border"></div>
                            <select
                                {...register("member_id")}
                                id="member_id"
                                className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 ${errors.member_id ? "border-red-500" : "border-border"}`}
                                disabled={isLoadingData || loadingExisting}
                            >
                                <option value="">{isLoadingData ? "Loading..." : "Select a member..."}</option>
                                {filteredMembers.map(m => (
                                    <option key={m.id} value={m.id}>{m.full_name}</option>
                                ))}
                            </select>
                        </div>
                        {errors.member_id && <p className="text-red-500 text-sm mt-1">{errors.member_id.message}</p>}
                    </div>
                </div>

                {/* 2. Collection Specific: Assigned Month (member's payout slot) */}
                {transactionType === "collection" && (
                    <div className="animate-fade-in">
                        <label htmlFor="slot_id" className="block text-lg font-medium text-text-secondary mb-1">
                            Assigned Month
                        </label>
                        <div className="relative flex items-center">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <Calendar className="w-5 h-5 text-text-secondary" />
                            </span>
                            <div className="absolute left-10 h-6 w-px bg-border"></div>
                            <select
                                {...register("slot_id")}
                                id="slot_id"
                                className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 ${errors.slot_id ? "border-red-500" : "border-border"}`}
                                disabled={!selectedMemberId || memberAssignedSlots.length <= 1}
                            >
                                <option value="">
                                    {!selectedMemberId
                                        ? "Select member first..."
                                        : memberAssignedSlots.length === 0
                                            ? "No assignments found"
                                            : memberAssignedSlots.length === 1
                                                ? `Month ${memberAssignedSlots[0].month} (auto-selected)`
                                                : "Select assignment..."}
                                </option>
                                {memberAssignedSlots.map(slot => {
                                    // Calculate date for this month
                                    let dateStr = "";
                                    if (selectedChitData?.start_date) {
                                        const startDate = new Date(selectedChitData.start_date);
                                        const slotDate = new Date(startDate);
                                        slotDate.setMonth(slotDate.getMonth() + slot.month - 1);
                                        dateStr = ` - ${String(slotDate.getMonth() + 1).padStart(2, '0')}/${slotDate.getFullYear()}`;
                                    }
                                    return (
                                        <option key={slot.id} value={slot.id}>
                                            Month {slot.month}{dateStr}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                        {errors.slot_id && <p className="text-red-500 text-sm mt-1">{errors.slot_id.message}</p>}
                    </div>
                )}

                {/* 3. Collection Specific: Collection Month (which month's collection) */}
                {transactionType === "collection" && (
                    <div className="animate-fade-in">
                        <label htmlFor="collection_month" className="block text-lg font-medium text-text-secondary mb-1">
                            Collection Month
                        </label>
                        <div className="relative flex items-center">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <Calendar className="w-5 h-5 text-text-secondary" />
                            </span>
                            <div className="absolute left-10 h-6 w-px bg-border"></div>
                            <select
                                {...register("collection_month")}
                                id="collection_month"
                                className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 ${errors.collection_month ? "border-red-500" : "border-border"}`}
                                disabled={!selectedChitId}
                            >
                                <option value="">
                                    {!selectedChitId
                                        ? "Select chit first..."
                                        : "Select collection month..."}
                                </option>
                                {selectedChitData && Array.from({ length: selectedChitData.duration_months }, (_, i) => i + 1).map(month => {
                                    // Calculate date for this month
                                    let dateStr = "";
                                    if (selectedChitData?.start_date) {
                                        const startDate = new Date(selectedChitData.start_date);
                                        const monthDate = new Date(startDate);
                                        monthDate.setMonth(monthDate.getMonth() + month - 1);
                                        dateStr = ` - ${String(monthDate.getMonth() + 1).padStart(2, '0')}/${monthDate.getFullYear()}`;
                                    }
                                    return (
                                        <option key={month} value={month}>
                                            Month {month}{dateStr}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                        {errors.collection_month && <p className="text-red-500 text-sm mt-1">{errors.collection_month.message}</p>}
                    </div>
                )}

                {/* 3. Payout Specific: Winning Month */}
                {transactionType === "payout" && (
                    <div className="animate-fade-in">
                        <label htmlFor="chit_assignment_id" className="block text-lg font-medium text-text-secondary mb-1">
                            Winning Assignment
                        </label>
                        <div className="relative flex items-center">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <Calendar className="w-5 h-5 text-text-secondary" />
                            </span>
                            <div className="absolute left-10 h-6 w-px bg-border"></div>
                            <select
                                {...register("chit_assignment_id")}
                                id="chit_assignment_id"
                                className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 ${errors.chit_assignment_id ? "border-red-500" : "border-border"}`}
                                disabled={!selectedMemberId || !selectedChitId}
                            >
                                <option value="">Select an assignment...</option>
                                {assignments.map(slot => (
                                    <option key={slot.id} value={slot.id}>
                                        Month {slot.month} - {slot.chit?.name || "Chit"}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {errors.chit_assignment_id && <p className="text-red-500 text-sm mt-1">{errors.chit_assignment_id.message}</p>}
                    </div>
                )}

                {/* 3. Amount & Date */}
                <div className="grid sm:grid-cols-2 gap-6">
                    {/* Amount */}
                    <div>
                        <label htmlFor="amount" className="block text-lg font-medium text-text-secondary mb-1">
                            Amount
                        </label>
                        <div className="relative flex items-center">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                {transactionType === "collection" ? (
                                    <WalletMinimal className="w-5 h-5 text-text-secondary" />
                                ) : (
                                    <TrendingUp className="w-5 h-5 text-text-secondary" />
                                )}
                            </span>
                            <div className="absolute left-10 h-6 w-px bg-border"></div>
                            <FormattedInput
                                name={transactionType === "collection" ? "amount_paid" : "amount"}
                                control={control}
                                placeholder="5000"
                                className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent ${(errors.amount || errors.amount_paid) ? "border-red-500" : "border-border"}`}
                            />
                        </div>
                        {(errors.amount || errors.amount_paid) && (
                            <p className="text-red-500 text-sm mt-1">{(errors.amount || errors.amount_paid)?.message}</p>
                        )}
                    </div>

                    {/* Date */}
                    <div>
                        <label htmlFor="date" className="block text-lg font-medium text-text-secondary mb-1">
                            Date
                        </label>
                        <Controller
                            control={control}
                            name={transactionType === "collection" ? "collection_date" : "paid_date"}
                            render={({ field }) => (
                                <CustomDateInput
                                    {...field}
                                    value={field.value || ""}
                                    onChange={(val) => field.onChange(val)}
                                    className={errors.collection_date || errors.paid_date ? "border-red-500" : ""}
                                />
                            )}
                        />
                        {(errors.collection_date || errors.paid_date) && (
                            <p className="text-red-500 text-sm mt-1">{(errors.collection_date || errors.paid_date)?.message}</p>
                        )}
                    </div>
                </div>

                {/* 4. Method */}
                <div>
                    <label htmlFor="method" className="block text-lg font-medium text-text-secondary mb-1">
                        Payment Method
                    </label>
                    <div className="relative flex items-center">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <CreditCard className="w-5 h-5 text-text-secondary" />
                        </span>
                        <div className="absolute left-10 h-6 w-px bg-border"></div>
                        <select
                            {...register(transactionType === "collection" ? "collection_method" : "method")}
                            id="method"
                            className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                        >
                            <option value="cash">Cash</option>
                            <option value="upi">UPI</option>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="cheque">Cheque</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>

                {/* 5. Notes */}
                <div>
                    <label htmlFor="notes" className="block text-lg font-medium text-text-secondary mb-1">
                        Notes (Optional)
                    </label>
                    <div className="relative flex items-center">
                        <span className="absolute top-4 left-0 flex items-center pl-3 pointer-events-none">
                            <FileText className="w-5 h-5 text-text-secondary" />
                        </span>
                        <div className="absolute top-2.5 left-10 h-6 w-px bg-border pointer-events-none"></div>
                        <textarea
                            {...register("notes")}
                            id="notes"
                            rows={3}
                            className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                            placeholder="e.g., Paid via GPay"
                            autoComplete="off"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="ghost" onClick={onCancel || (() => navigate(-1))}>Cancel</Button>
                    <Button
                        type="submit"
                        variant={transactionType === "collection" ? "success" : "error"}
                        disabled={mutation.isPending}
                        className="w-full md:w-auto min-w-[120px]"
                    >
                        {mutation.isPending ? (
                            <Loader2 className="animate-spin mx-auto w-5 h-5" />
                        ) : (
                            <>
                                {transactionId ? (
                                    <><SquarePen className="inline-block mr-2 w-5 h-5" />Update</>
                                ) : (
                                    <><Save className="inline-block mr-2 w-5 h-5" />Save</>
                                )} {transactionType === "collection" ? "Collection" : "Payout"}
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </fieldset>
    );
};

export default TransactionForm;
