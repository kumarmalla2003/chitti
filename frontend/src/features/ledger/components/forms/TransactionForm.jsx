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
} from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { getAllChits } from "../../../../services/chitsService";
import { getAllMembers } from "../../../../services/membersService";
import { getAssignmentsForMember, getAssignmentsForChit } from "../../../../services/assignmentsService";
import { createPayment, updatePayment } from "../../../../services/paymentsService";
import { updatePayout } from "../../../../services/payoutsService";

import Message from "../../../../components/ui/Message";
import Button from "../../../../components/ui/Button";
import FormattedInput from "../../../../components/ui/FormattedInput";
import CustomDateInput from "../../../../components/ui/CustomDateInput";

// Schema for Collection
const collectionSchema = z.object({
    member_id: z.string().min(1, "Member is required"),
    chit_id: z.string().min(1, "Chit is required"),
    amount_paid: z.number({ invalid_type_error: "Amount must be a number" }).positive("Amount must be positive"),
    collection_date: z.string().min(1, "Date is required"),
    collection_method: z.string().min(1, "Method is required"),
    notes: z.string().optional().nullable(),
});

// Schema for Payout
const payoutSchema = z.object({
    chit_id: z.string().min(1, "Chit is required"),
    member_id: z.string().min(1, "Member is required"),
    chit_assignment_id: z.string().min(1, "Winning month is required"),
    amount: z.number({ invalid_type_error: "Amount must be a number" }).positive("Amount must be positive"),
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
    onTypeChange
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
            amount_paid: "",
            collection_date: new Date().toISOString().split("T")[0],
            collection_method: "Cash",
            notes: "",
        } : {
            chit_id: initialChitId || "",
            member_id: initialMemberId || "",
            chit_assignment_id: "",
            amount: "",
            paid_date: new Date().toISOString().split("T")[0],
            method: "Cash",
            notes: "",
        };
    }, [initialData, initialChitId, initialMemberId, transactionType]);

    const {
        register,
        control,
        handleSubmit,
        reset,
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

    // 2. Cascade: Filter Chits/Members based on selection
    useEffect(() => {
        if (selectedChitId) {
            const filterMembers = async () => {
                try {
                    const res = await getAssignmentsForChit(selectedChitId);
                    const chitMemberIds = new Set(res.assignments.map(a => a.member.id));
                    setFilteredMembers(allMembers.filter(m => chitMemberIds.has(m.id)));
                } catch (e) { console.error(e); }
            };
            filterMembers();
        } else {
            setFilteredMembers(allMembers);
        }
    }, [selectedChitId, allMembers]);

    useEffect(() => {
        if (selectedMemberId && !selectedChitId) {
            const filterChits = async () => {
                try {
                    const res = await getAssignmentsForMember(selectedMemberId);
                    const memberChitIds = new Set(res.map(a => a.chit.id));
                    setFilteredChits(allChits.filter(c => memberChitIds.has(c.id)));
                } catch (e) { console.error(e); }
            };
            filterChits();
        } else if (!selectedMemberId && !selectedChitId) {
            setFilteredChits(allChits);
        }
    }, [selectedMemberId, selectedChitId, allChits]);

    // 3. For Payouts: Load Winning Assignments (Eligible Slots)
    useEffect(() => {
        if (transactionType === "payout" && selectedChitId && selectedMemberId) {
            const loadAssignments = async () => {
                try {
                    const res = await getAssignmentsForMember(selectedMemberId);
                    const chitAssignments = res.filter(a => a.chit.id === parseInt(selectedChitId));
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
                const payload = { ...data, payment_type: "collection" };
                if (transactionId) {
                    return updatePayment(transactionId, payload);
                } else {
                    return createPayment(payload);
                }
            } else {
                if (transactionId) {
                    return updatePayout(transactionId, data);
                } else {
                    return updatePayout(data.chit_assignment_id, data);
                }
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["collections"] });
            queryClient.invalidateQueries({ queryKey: ["payouts"] });
            queryClient.invalidateQueries({ queryKey: ["ledger"] });
            navigate(-1);
            if (onSuccess) onSuccess();
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
        <fieldset disabled={false} className="space-y-6">
            {/* Type Switcher - Only show when creating new */}
            {!transactionId && (
                <div className="flex justify-center">
                    <div className="bg-background-tertiary p-1 rounded-lg flex gap-1">
                        <button
                            type="button"
                            onClick={() => setTransactionType("collection")}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${transactionType === "collection"
                                ? "bg-background-secondary shadow-sm text-success-accent"
                                : "text-text-secondary hover:text-text-primary"
                                }`}
                        >
                            Collection
                        </button>
                        <button
                            type="button"
                            onClick={() => setTransactionType("payout")}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${transactionType === "payout"
                                ? "bg-background-secondary shadow-sm text-error-accent"
                                : "text-text-secondary hover:text-text-primary"
                                }`}
                        >
                            Payout
                        </button>
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
                                disabled={!!initialChitId || isLoadingData}
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
                                disabled={!!initialMemberId || isLoadingData}
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

                {/* 2. Payout Specific: Winning Month */}
                {transactionType === "payout" && (
                    <div>
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
                                {assignments.map(a => (
                                    <option key={a.id} value={a.id}>{a.chit_month} (Month {a.month_number})</option>
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
                            <option value="Cash">Cash</option>
                            <option value="UPI">UPI</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Cheque">Cheque</option>
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
                    <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
                    <Button type="submit" variant="primary" isLoading={mutation.isPending}>
                        {transactionId ? (
                            <><SquarePen className="inline-block mr-2 w-5 h-5" />Update</>
                        ) : (
                            <><Save className="inline-block mr-2 w-5 h-5" />Save</>
                        )} {transactionType === "collection" ? "Collection" : "Payout"}
                    </Button>
                </div>
            </form>
        </fieldset>
    );
};

export default TransactionForm;
