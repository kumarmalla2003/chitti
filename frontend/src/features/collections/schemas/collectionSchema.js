import { z } from "zod";

/**
 * Schema for updating/recording a collection payment.
 * In the schedule-based workflow, collections are created automatically.
 * This schema is used when recording an actual payment against a scheduled collection.
 */
export const collectionSchema = z.object({
    // Expected amount (set during scheduling)
    expected_amount: z.number({ invalid_type_error: "Amount must be a number" }).nonnegative("Amount cannot be negative").optional(),

    // Actual payment data
    amount: z.number({ invalid_type_error: "Amount must be a number" }).positive("Amount must be positive").optional(),
    date: z.string().min(1, "Date is required").optional(),
    method: z.string().min(1, "Method is required").optional(),
    notes: z.string().optional(),

    // Assignment data (for linking to member)
    member_id: z.union([z.string(), z.number()]).transform((val) => Number(val)).optional(),
    chit_assignment_id: z.union([z.string(), z.number()]).transform((val) => Number(val)).optional(),
});

/**
 * Schema for recording a new payment.
 */
export const collectionPaymentSchema = z.object({
    amount: z.number({ invalid_type_error: "Amount must be a number" }).positive("Amount must be positive"),
    date: z.string().min(1, "Date is required"),
    method: z.string().min(1, "Method is required"),
    notes: z.string().optional(),
});
