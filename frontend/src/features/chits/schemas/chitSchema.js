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

// Helper for percentage input (0-100)
const percentNumber = z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? 0 : Number(val)),
    z.number().min(0, "Must be 0 or greater").max(100, "Must be 100 or less")
);

export const chitSchema = z.object({
    name: z.string().min(3, "Chit name must be at least 3 characters").max(50, "Chit name too long"),
    chit_value: z.number({ invalid_type_error: "Chit value is required" }).positive("Chit value must be positive"),
    size: z.number({ invalid_type_error: "Size is required" }).int().positive("Size must be positive"),

    // Chit Type
    chit_type: z.enum(["fixed", "variable", "auction"]).default("fixed"),

    // Installment fields - use preprocess to handle empty strings gracefully
    monthly_installment: optionalNumber,
    // Variable Chit: payout premium percentage (0-100)
    payout_premium_percent: percentNumber,
    // Auction Chit: foreman commission percentage (0-100)
    foreman_commission_percent: percentNumber,

    duration_months: z.number({ invalid_type_error: "Duration is required" }).int().positive("Duration must be positive"),
    start_date: z.string().regex(/^\d{4}-\d{2}$/, "Start date must be in YYYY-MM format"),
    end_date: z.string().regex(/^\d{4}-\d{2}$/, "End date must be in YYYY-MM format").optional(),
    collection_day: z.number().int().min(1, "Day must be between 1 and 28").max(28, "Day must be between 1 and 28"),
    payout_day: z.number().int().min(1, "Day must be between 1 and 28").max(28, "Day must be between 1 and 28"),

    // Optional notes field
    notes: z.string().optional().or(z.literal('')),
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
        if (data.payout_premium_percent < 0 || data.payout_premium_percent > 100) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Payout premium must be between 0 and 100%",
                path: ["payout_premium_percent"],
            });
        }
    }
    // Auction chits: Validate foreman commission
    else if (data.chit_type === "auction") {
        if (data.foreman_commission_percent < 0 || data.foreman_commission_percent > 100) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Foreman commission must be between 0 and 100%",
                path: ["foreman_commission_percent"],
            });
        }
    }
});

// Helper function to calculate installments for variable chits
export const calculateInstallments = (chitValue, size, payoutPremiumPercent) => {
    if (!size || size <= 0) return { before: 0, after: 0 };
    const before = Math.floor(chitValue / size);
    const after = Math.floor(before + (chitValue * payoutPremiumPercent / 100));
    return { before, after };
};
