// frontend/src/features/chits/components/sections/TransactionsSection/components/PayoutForm.jsx

import { useState, useEffect, forwardRef, useImperativeHandle, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Button from "../../../../../../components/ui/Button";
import Message from "../../../../../../components/ui/Message";
import FormattedInput from "../../../../../../components/ui/FormattedInput";
import { Save, Loader2, Calendar, CreditCard, FileText, TrendingUp, IndianRupee } from "lucide-react";
import { updatePayout } from "../../../../../../services/payoutsService";
import { PAYMENT_METHODS } from "../utils/helpers";

// Validation schema
const payoutSchema = z.object({
    payout_id: z.string().min(1, "Payout month is required"),
    amount: z.number().positive("Amount must be greater than 0"),
    paid_date: z.string().min(1, "Date is required"),
    method: z.string().min(1, "Payment method is required"),
    notes: z.string().optional(),
});

/**
 * PayoutForm - Inline form for recording a payout disbursement
 * Follows AssignNewMemberForm pattern with goBack() exposed via ref
 */
const PayoutForm = forwardRef(
    ({ chitId, payouts = [], assignments = [], chitStartDate, onPayoutRecorded, onBackToList }, ref) => {
        const {
            register,
            handleSubmit,
            control,
            watch,
            setValue,
            formState: { errors },
        } = useForm({
            resolver: zodResolver(payoutSchema),
            defaultValues: {
                payout_id: "",
                amount: "",
                paid_date: new Date().toISOString().split("T")[0],
                method: "Cash",
                notes: "",
            },
            mode: "onTouched",
        });

        const [loading, setLoading] = useState(false);
        const [pageError, setPageError] = useState(null);
        const [success, setSuccess] = useState(null);

        const selectedPayoutId = watch("payout_id");

        useImperativeHandle(ref, () => ({
            goBack: () => {
                onBackToList();
            },
        }));

        useEffect(() => {
            if (success) {
                const timer = setTimeout(() => {
                    onBackToList();
                }, 1500);
                return () => clearTimeout(timer);
            }
        }, [success, onBackToList]);

        // When payout is selected, auto-fill the planned amount
        useEffect(() => {
            if (selectedPayoutId) {
                const payout = payouts.find((p) => String(p.id) === selectedPayoutId);
                if (payout && payout.planned_amount) {
                    setValue("amount", payout.planned_amount);
                }
            }
        }, [selectedPayoutId, payouts, setValue]);

        // Filter to only show unpaid payouts with an assigned member
        const availablePayouts = useMemo(() => {
            return payouts.filter((p) => !p.paid_date && p.member_id);
        }, [payouts]);

        const handleRecordPayout = async (data) => {
            setLoading(true);
            setPageError(null);
            try {
                const payoutData = {
                    amount: data.amount,
                    paid_date: data.paid_date,
                    method: data.method,
                    notes: data.notes || null,
                };

                await updatePayout(parseInt(data.payout_id), payoutData);
                setSuccess("Payout recorded successfully!");
                if (onPayoutRecorded) {
                    onPayoutRecorded();
                }
            } catch (err) {
                setPageError(err.message);
            } finally {
                setLoading(false);
            }
        };

        // Format payout option label
        const formatPayoutLabel = (payout) => {
            if (!chitStartDate) return `Month ${payout.month}`;
            const d = new Date(chitStartDate);
            d.setMonth(d.getMonth() + (payout.month - 1));
            const monthYear = d.toLocaleDateString("en-IN", {
                month: "short",
                year: "numeric",
            });

            // Find member name from assignments
            const assignment = assignments.find((a) => {
                const aDate = new Date(a.chit_month);
                return aDate.getMonth() === d.getMonth() && aDate.getFullYear() === d.getFullYear();
            });
            const memberName = assignment?.member?.full_name || payout.member?.full_name || "Unassigned";
            const plannedAmount = payout.planned_amount
                ? `₹${new Intl.NumberFormat("en-IN").format(payout.planned_amount)}`
                : "";

            return `${monthYear} - ${memberName}${plannedAmount ? ` (${plannedAmount})` : ""}`;
        };

        return (
            <div className="my-4">
                {pageError && (
                    <Message type="error" onClose={() => setPageError(null)}>
                        {pageError}
                    </Message>
                )}
                {success && <Message type="success">{success}</Message>}

                {availablePayouts.length === 0 ? (
                    <div className="text-center py-8">
                        <TrendingUp className="mx-auto h-8 w-8 text-text-secondary opacity-50" />
                        <p className="mt-2 text-sm text-text-secondary">
                            No pending payouts available. All payouts have been disbursed or no members assigned yet.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-4">
                            {/* Payout Selection */}
                            <div>
                                <label
                                    htmlFor="payout_id"
                                    className="block text-sm font-medium text-text-primary mb-1"
                                >
                                    Payout Month <span className="text-error-accent">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                        <TrendingUp className="w-4 h-4 text-text-secondary" />
                                    </span>
                                    <select
                                        {...register("payout_id")}
                                        id="payout_id"
                                        className={`w-full pl-10 pr-4 py-2 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent appearance-none ${errors.payout_id ? "border-error-accent" : "border-border"
                                            }`}
                                    >
                                        <option value="">Select payout month...</option>
                                        {availablePayouts.map((payout) => (
                                            <option key={payout.id} value={payout.id}>
                                                {formatPayoutLabel(payout)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {errors.payout_id && (
                                    <p className="text-error-accent text-xs font-medium mt-1">
                                        {errors.payout_id.message}
                                    </p>
                                )}
                            </div>

                            {/* Amount */}
                            <div>
                                <label
                                    htmlFor="amount"
                                    className="block text-sm font-medium text-text-primary mb-1"
                                >
                                    Amount <span className="text-error-accent">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 z-10">
                                        <IndianRupee className="w-4 h-4 text-text-secondary" />
                                    </span>
                                    <FormattedInput
                                        name="amount"
                                        control={control}
                                        format={(value) => {
                                            if (value === "" || value === null || value === undefined) return "";
                                            return new Intl.NumberFormat("en-IN").format(value);
                                        }}
                                        parse={(inputValue) => {
                                            const cleaned = inputValue.replace(/[^0-9.]/g, "");
                                            return cleaned === "" ? "" : parseFloat(cleaned) || 0;
                                        }}
                                        id="amount"
                                        placeholder="Enter amount"
                                        inputMode="decimal"
                                        className={`w-full pl-10 pr-4 py-2 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent ${errors.amount ? "border-error-accent" : "border-border"
                                            }`}
                                    />
                                </div>
                                {errors.amount && (
                                    <p className="text-error-accent text-xs font-medium mt-1">
                                        {errors.amount.message}
                                    </p>
                                )}
                            </div>

                            {/* Paid Date */}
                            <div>
                                <label
                                    htmlFor="paid_date"
                                    className="block text-sm font-medium text-text-primary mb-1"
                                >
                                    Payout Date <span className="text-error-accent">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                        <Calendar className="w-4 h-4 text-text-secondary" />
                                    </span>
                                    <input
                                        {...register("paid_date")}
                                        type="date"
                                        id="paid_date"
                                        className={`w-full pl-10 pr-4 py-2 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent ${errors.paid_date ? "border-error-accent" : "border-border"
                                            }`}
                                    />
                                </div>
                                {errors.paid_date && (
                                    <p className="text-error-accent text-xs font-medium mt-1">
                                        {errors.paid_date.message}
                                    </p>
                                )}
                            </div>

                            {/* Payment Method */}
                            <div>
                                <label
                                    htmlFor="method"
                                    className="block text-sm font-medium text-text-primary mb-1"
                                >
                                    Payment Method <span className="text-error-accent">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                        <CreditCard className="w-4 h-4 text-text-secondary" />
                                    </span>
                                    <select
                                        {...register("method")}
                                        id="method"
                                        className={`w-full pl-10 pr-4 py-2 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent appearance-none ${errors.method ? "border-error-accent" : "border-border"
                                            }`}
                                    >
                                        {PAYMENT_METHODS.map((method) => (
                                            <option key={method.value} value={method.value}>
                                                {method.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {errors.method && (
                                    <p className="text-error-accent text-xs font-medium mt-1">
                                        {errors.method.message}
                                    </p>
                                )}
                            </div>

                            {/* Notes */}
                            <div>
                                <label
                                    htmlFor="notes"
                                    className="block text-sm font-medium text-text-primary mb-1"
                                >
                                    Notes
                                </label>
                                <div className="relative">
                                    <span className="absolute top-2 left-0 flex items-start pl-3">
                                        <FileText className="w-4 h-4 text-text-secondary" />
                                    </span>
                                    <textarea
                                        {...register("notes")}
                                        id="notes"
                                        rows={2}
                                        placeholder="Optional notes..."
                                        className="w-full pl-10 pr-4 py-2 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <Button
                                type="button"
                                variant="success"
                                onClick={handleSubmit(handleRecordPayout)}
                                disabled={loading || success}
                                className="flex items-center justify-center"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" />
                                ) : (
                                    <>
                                        <Save className="w-5 h-5 mr-2" /> Record Payout
                                    </>
                                )}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        );
    }
);

PayoutForm.displayName = "PayoutForm";

export default PayoutForm;
