import { z } from "zod";

export const chitSchema = z.object({
    name: z.string().min(3, "Chit name must be at least 3 characters").max(50, "Chit name too long"),
    chit_value: z.number({ invalid_type_error: "Chit value is required" }).positive("Chit value must be positive"),
    size: z.number({ invalid_type_error: "Size is required" }).int().positive("Size must be positive"),
    monthly_installment: z.number({ invalid_type_error: "Installment is required" }).positive("Installment must be positive"),
    duration_months: z.number({ invalid_type_error: "Duration is required" }).int().positive("Duration must be positive"),
    start_date: z.string().regex(/^\d{4}-\d{2}$/, "Start date must be in YYYY-MM format"),
    end_date: z.string().regex(/^\d{4}-\d{2}$/, "End date must be in YYYY-MM format").optional(),
    collection_day: z.number().int().min(1, "Day must be between 1 and 28").max(28, "Day must be between 1 and 28"),
    payout_day: z.number().int().min(1, "Day must be between 1 and 28").max(28, "Day must be between 1 and 28"),
});
