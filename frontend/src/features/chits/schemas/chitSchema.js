import { z } from "zod";

// Chit Type Enum
export const ChitTypeEnum = {
    FIXED: "fixed",
    VARIABLE: "variable",
    AUCTION: "auction",
};

// Helper to handle empty string or number input
const optionalNumber = z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? 0 : Number(val)),
    z.number().int().nonnegative()
);

export const chitSchema = z.object({
    name: z.string().min(3, "Chit name must be at least 3 characters").max(50, "Chit name too long"),
    chit_value: z.number({ invalid_type_error: "Chit value is required" }).positive("Chit value must be positive"),
    size: z.number({ invalid_type_error: "Size is required" }).int().positive("Size must be positive"),
    
    // Chit Type
    chit_type: z.enum(["fixed", "variable", "auction"]).default("fixed"),
    
    // Installment fields - use preprocess to handle empty strings gracefully
    monthly_installment: optionalNumber,
    installment_before_payout: optionalNumber,
    installment_after_payout: optionalNumber,
    
    duration_months: z.number({ invalid_type_error: "Duration is required" }).int().positive("Duration must be positive"),
    start_date: z.string().regex(/^\d{4}-\d{2}$/, "Start date must be in YYYY-MM format"),
    end_date: z.string().regex(/^\d{4}-\d{2}$/, "End date must be in YYYY-MM format").optional(),
    collection_day: z.number().int().min(1, "Day must be between 1 and 28").max(28, "Day must be between 1 and 28"),
    payout_day: z.number().int().min(1, "Day must be between 1 and 28").max(28, "Day must be between 1 and 28"),
}).superRefine((data, ctx) => {
    // Conditional validation based on chit_type
    if (data.chit_type === "fixed") {
        if (!data.monthly_installment || data.monthly_installment <= 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Monthly installment is required for Fixed chits",
                path: ["monthly_installment"],
            });
        }
    } else if (data.chit_type === "variable") {
        if (!data.installment_before_payout || data.installment_before_payout <= 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Pre-payout installment is required for Variable chits",
                path: ["installment_before_payout"],
            });
        }
        if (!data.installment_after_payout || data.installment_after_payout <= 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Post-payout installment is required for Variable chits",
                path: ["installment_after_payout"],
            });
        }
    }
    // Auction chits: No installment validation needed (amounts vary monthly)
});
