// frontend/src/features/chits/components/sections/TransactionsSection/components/CollectionForm.jsx

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Button from "../../../../../../components/ui/Button";
import Message from "../../../../../../components/ui/Message";
import FormattedInput from "../../../../../../components/ui/FormattedInput";
import { Save, Loader2, Calendar, CreditCard, FileText, User, IndianRupee } from "lucide-react";
import { createCollection } from "../../../../../../services/collectionsService";
import { PAYMENT_METHODS } from "../utils/helpers";

// Validation schema
const collectionSchema = z.object({
    chit_assignment_id: z.string().min(1, "Assignment is required"),
    amount_paid: z.number().positive("Amount must be greater than 0"),
    collection_date: z.string().min(1, "Date is required"),
    collection_method: z.string().min(1, "Payment method is required"),
    notes: z.string().optional(),
});

/**
 * CollectionForm - Inline form for logging a new collection
 * Follows AssignNewMemberForm pattern with goBack() exposed via ref
 */
const CollectionForm = forwardRef(
    ({ chitId, assignments = [], onCollectionCreated, onBackToList }, ref) => {
        const {
            register,
            handleSubmit,
            control,
            formState: { errors },
        } = useForm({
            resolver: zodResolver(collectionSchema),
            defaultValues: {
                chit_assignment_id: "",
                amount_paid: "",
                collection_date: new Date().toISOString().split("T")[0],
                collection_method: "Cash",
                notes: "",
            },
            mode: "onTouched",
        });

        const [loading, setLoading] = useState(false);
        const [pageError, setPageError] = useState(null);
        const [success, setSuccess] = useState(null);

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

        const handleCreateCollection = async (data) => {
            setLoading(true);
            setPageError(null);
            try {
                const selectedAssignment = assignments.find(
                    (a) => String(a.id) === data.chit_assignment_id
                );

                const collectionData = {
                    chit_assignment_id: parseInt(data.chit_assignment_id),
                    chit_id: chitId,
                    member_id: selectedAssignment?.member?.id,
                    amount_paid: data.amount_paid,
                    collection_date: data.collection_date,
                    collection_method: data.collection_method,
                    notes: data.notes || null,
                };

                await createCollection(collectionData);
                setSuccess("Collection logged successfully!");
                if (onCollectionCreated) {
                    onCollectionCreated();
                }
            } catch (err) {
                setPageError(err.message);
            } finally {
                setLoading(false);
            }
        };

        // Format assignment option label
        const formatAssignmentLabel = (assignment) => {
            const date = new Date(assignment.chit_month);
            const monthYear = date.toLocaleDateString("en-IN", {
                month: "short",
                year: "numeric",
            });
            return `${monthYear} - ${assignment.member?.full_name || "Unknown"}`;
        };

        return (
            <div className="my-4">
                {pageError && (
                    <Message type="error" onClose={() => setPageError(null)}>
                        {pageError}
                    </Message>
                )}
                {success && <Message type="success">{success}</Message>}

                <div className="space-y-4">
                    {/* Assignment Selection */}
                    <div>
                        <label
                            htmlFor="chit_assignment_id"
                            className="block text-sm font-medium text-text-primary mb-1"
                        >
                            Month / Member <span className="text-error-accent">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <User className="w-4 h-4 text-text-secondary" />
                            </span>
                            <select
                                {...register("chit_assignment_id")}
                                id="chit_assignment_id"
                                className={`w-full pl-10 pr-4 py-2 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent appearance-none ${errors.chit_assignment_id ? "border-error-accent" : "border-border"
                                    }`}
                            >
                                <option value="">Select month/member...</option>
                                {assignments.map((assignment) => (
                                    <option key={assignment.id} value={assignment.id}>
                                        {formatAssignmentLabel(assignment)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {errors.chit_assignment_id && (
                            <p className="text-error-accent text-xs font-medium mt-1">
                                {errors.chit_assignment_id.message}
                            </p>
                        )}
                    </div>

                    {/* Amount */}
                    <div>
                        <label
                            htmlFor="amount_paid"
                            className="block text-sm font-medium text-text-primary mb-1"
                        >
                            Amount <span className="text-error-accent">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 z-10">
                                <IndianRupee className="w-4 h-4 text-text-secondary" />
                            </span>
                            <FormattedInput
                                name="amount_paid"
                                control={control}
                                format={(value) => {
                                    if (value === "" || value === null || value === undefined) return "";
                                    return new Intl.NumberFormat("en-IN").format(value);
                                }}
                                parse={(inputValue) => {
                                    const cleaned = inputValue.replace(/[^0-9.]/g, "");
                                    return cleaned === "" ? "" : parseFloat(cleaned) || 0;
                                }}
                                id="amount_paid"
                                placeholder="Enter amount"
                                inputMode="decimal"
                                className={`w-full pl-10 pr-4 py-2 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent ${errors.amount_paid ? "border-error-accent" : "border-border"
                                    }`}
                            />
                        </div>
                        {errors.amount_paid && (
                            <p className="text-error-accent text-xs font-medium mt-1">
                                {errors.amount_paid.message}
                            </p>
                        )}
                    </div>

                    {/* Collection Date */}
                    <div>
                        <label
                            htmlFor="collection_date"
                            className="block text-sm font-medium text-text-primary mb-1"
                        >
                            Collection Date <span className="text-error-accent">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <Calendar className="w-4 h-4 text-text-secondary" />
                            </span>
                            <input
                                {...register("collection_date")}
                                type="date"
                                id="collection_date"
                                className={`w-full pl-10 pr-4 py-2 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent ${errors.collection_date ? "border-error-accent" : "border-border"
                                    }`}
                            />
                        </div>
                        {errors.collection_date && (
                            <p className="text-error-accent text-xs font-medium mt-1">
                                {errors.collection_date.message}
                            </p>
                        )}
                    </div>

                    {/* Payment Method */}
                    <div>
                        <label
                            htmlFor="collection_method"
                            className="block text-sm font-medium text-text-primary mb-1"
                        >
                            Payment Method <span className="text-error-accent">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <CreditCard className="w-4 h-4 text-text-secondary" />
                            </span>
                            <select
                                {...register("collection_method")}
                                id="collection_method"
                                className={`w-full pl-10 pr-4 py-2 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent appearance-none ${errors.collection_method ? "border-error-accent" : "border-border"
                                    }`}
                            >
                                {PAYMENT_METHODS.map((method) => (
                                    <option key={method.value} value={method.value}>
                                        {method.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {errors.collection_method && (
                            <p className="text-error-accent text-xs font-medium mt-1">
                                {errors.collection_method.message}
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
                        onClick={handleSubmit(handleCreateCollection)}
                        disabled={loading || success}
                        className="flex items-center justify-center"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" />
                        ) : (
                            <>
                                <Save className="w-5 h-5 mr-2" /> Log Collection
                            </>
                        )}
                    </Button>
                </div>
            </div>
        );
    }
);

CollectionForm.displayName = "CollectionForm";

export default CollectionForm;
