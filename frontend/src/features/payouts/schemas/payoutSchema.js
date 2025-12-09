import { z } from "zod";

export const payoutSchema = z.object({
    member_id: z.string().min(1, "Member is required"),
    chit_id: z.string().min(1, "Chit is required"),
    chit_assignment_id: z.string().min(1, "Winning Month is required"),
    amount: z.number({ invalid_type_error: "Amount must be a number" }).positive("Amount must be positive"),
    paid_date: z.string().min(1, "Payout Date is required"),
    method: z.string().min(1, "Payment Method is required"),
    notes: z.string().optional(),
});
