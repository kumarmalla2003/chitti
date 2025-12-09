import { z } from "zod";

export const collectionSchema = z.object({
    member_id: z.string().min(1, "Member is required"),
    chit_id: z.string().min(1, "Chit is required"),
    chit_assignment_id: z.string().min(1, "Assignment Month is required"),
    amount_paid: z.number({ invalid_type_error: "Amount must be a number" }).positive("Amount must be positive"),
    collection_date: z.string().min(1, "Collection Date is required"),
    collection_method: z.string().min(1, "Collection Method is required"),
    notes: z.string().optional(),
});
