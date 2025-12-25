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
    name: z.string({ required_error: "Chit Name is required." }).min(1, "Chit Name is required.").min(3, "Chit Name must be at least 3 characters.").max(50, "Chit Name cannot exceed 50 characters."),
    chit_value: z.union([z.string(), z.number(), z.undefined(), z.null()])
        .refine((val) => val !== "" && val !== undefined && val !== null, {
            message: "Chit Value is required."
        })
        .transform((val) => Number(val))
        .refine((val) => !isNaN(val) && val >= 10000, { message: "Chit Value must be at least ₹10,000." })
        .refine((val) => val <= 1000000000, { message: "Chit Value cannot exceed ₹100 Crores." }),
    size: z.union([z.string(), z.number(), z.undefined(), z.null()])
        .refine((val) => val !== "" && val !== undefined && val !== null, {
            message: "Size is required."
        })
        .transform((val) => Number(val))
        .refine((val) => !isNaN(val) && Number.isInteger(val) && val >= 10, { message: "Size must be at least 10 members." })
        .refine((val) => val <= 100, { message: "Size cannot exceed 100 members." }),

    // Chit Type
    chit_type: z.enum(["fixed", "variable", "auction"]).default("fixed"),

    // Installment fields - use preprocess to handle empty strings gracefully
    monthly_installment: z.preprocess(
        (val) => (val === "" || val === undefined || val === null ? 0 : Number(val)),
        z.number().int().nonnegative().max(100000000, "Monthly Installment cannot exceed ₹10 Crores.")
    ),
    // Variable Chit: payout premium percentage (0-100)
    payout_premium_percent: z.preprocess(
        (val) => (val === "" || val === undefined || val === null ? 0 : Number(val)),
        z.number().min(0, "Payout Premium cannot be negative.").max(100, "Payout Premium cannot exceed 100%.")
    ),
    // Variable/Auction Chit: foreman commission percentage (0-100)
    foreman_commission_percent: z.preprocess(
        (val) => (val === "" || val === undefined || val === null ? 0 : Number(val)),
        z.number().min(0, "Foreman Commission cannot be negative.").max(100, "Foreman Commission cannot exceed 100%.")
    ),

    duration_months: z.union([z.string(), z.number(), z.undefined(), z.null()])
        .refine((val) => val !== "" && val !== undefined && val !== null, {
            message: "Duration is required."
        })
        .transform((val) => Number(val))
        .refine((val) => !isNaN(val) && Number.isInteger(val) && val >= 10, { message: "Duration must be at least 10 months." })
        .refine((val) => val <= 100, { message: "Duration cannot exceed 100 months." }),
    start_date: z.string({ required_error: "Start Date is required." })
        .min(1, "Start Date is required.")
        .regex(/^\d{4}-\d{2}$/, "Start Date must be in MM/YYYY format.")
        .refine((val) => {
            const month = parseInt(val.split("-")[1], 10);
            return month >= 1 && month <= 12;
        }, { message: "Month must be between 01 and 12." })
        .refine((val) => {
            const [year, month] = val.split("-").map(Number);
            return year > 2000 || (year === 2000 && month >= 1);
        }, { message: "Start Date cannot be before 01/2000." })
        .refine((val) => {
            const [year, month] = val.split("-").map(Number);
            return year < 2999 || (year === 2999 && month <= 12);
        }, { message: "Start Date cannot be after 12/2999." }),
    end_date: z.string({ required_error: "End Date is required." })
        .min(1, "End Date is required.")
        .regex(/^\d{4}-\d{2}$/, "End Date must be in MM/YYYY format.")
        .refine((val) => {
            const month = parseInt(val.split("-")[1], 10);
            return month >= 1 && month <= 12;
        }, { message: "Month must be between 01 and 12." })
        .refine((val) => {
            const [year, month] = val.split("-").map(Number);
            return year > 2000 || (year === 2000 && month >= 1);
        }, { message: "End Date cannot be before 01/2000." })
        .refine((val) => {
            const [year, month] = val.split("-").map(Number);
            return year < 2999 || (year === 2999 && month <= 12);
        }, { message: "End Date cannot be after 12/2999." }),
    collection_day: z.union([z.string(), z.number(), z.undefined(), z.null()])
        .refine((val) => val !== "" && val !== undefined && val !== null, {
            message: "Collection Day is required."
        })
        .transform((val) => Number(val))
        .refine((val) => !isNaN(val) && Number.isInteger(val) && val > 0, { message: "Collection Day must be greater than 0." })
        .refine((val) => val < 28, { message: "Collection Day must be less than 28." }),
    payout_day: z.union([z.string(), z.number(), z.undefined(), z.null()])
        .refine((val) => val !== "" && val !== undefined && val !== null, {
            message: "Payout Day is required."
        })
        .transform((val) => Number(val))
        .refine((val) => !isNaN(val) && Number.isInteger(val) && val > 0, { message: "Payout Day must be greater than 0." })
        .refine((val) => val < 29, { message: "Payout Day must be less than 29." }),

    // Optional notes field (max 1000000 characters)
    notes: z.string().max(1000000, "Notes cannot exceed 1,000,000 characters.").optional().or(z.literal('')),
}).superRefine((data, ctx) => {
    // Conditional validation based on chit_type
    if (data.chit_type === "fixed") {
        if (!data.monthly_installment || data.monthly_installment <= 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Monthly Installment is required for Fixed chits.",
                path: ["monthly_installment"],
            });
        } else if (data.monthly_installment < 1000) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Monthly Installment must be at least ₹1,000.",
                path: ["monthly_installment"],
            });
        }
    } else if (data.chit_type === "variable") {
        // Require payout_premium_percent for variable chits (must be >= 0.5)
        if (!data.payout_premium_percent || data.payout_premium_percent <= 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Payout Premium is required for Variable chits.",
                path: ["payout_premium_percent"],
            });
        } else if (data.payout_premium_percent < 0.5) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Payout Premium must be at least 0.5%.",
                path: ["payout_premium_percent"],
            });
        } else if (data.payout_premium_percent > 100) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Payout Premium cannot exceed 100%.",
                path: ["payout_premium_percent"],
            });
        }
        // Require foreman_commission_percent for variable chits (must be >= 0.5)
        if (!data.foreman_commission_percent || data.foreman_commission_percent <= 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Foreman Commission is required for Variable chits.",
                path: ["foreman_commission_percent"],
            });
        } else if (data.foreman_commission_percent < 0.5) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Foreman Commission must be at least 0.5%.",
                path: ["foreman_commission_percent"],
            });
        } else if (data.foreman_commission_percent > 100) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Foreman Commission cannot exceed 100%.",
                path: ["foreman_commission_percent"],
            });
        }
    }
    // Auction chits: Require foreman commission (must be >= 0.5)
    else if (data.chit_type === "auction") {
        if (!data.foreman_commission_percent || data.foreman_commission_percent <= 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Foreman Commission is required for Auction chits.",
                path: ["foreman_commission_percent"],
            });
        } else if (data.foreman_commission_percent < 0.5) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Foreman Commission must be at least 0.5%.",
                path: ["foreman_commission_percent"],
            });
        } else if (data.foreman_commission_percent > 100) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Foreman Commission cannot exceed 100%.",
                path: ["foreman_commission_percent"],
            });
        }
    }

    // Cross-field validation: end_date must be after start_date
    if (data.start_date && data.end_date) {
        const startDate = new Date(data.start_date + "-01");
        const endDate = new Date(data.end_date + "-01");
        if (endDate <= startDate) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "End Date must be after Start Date.",
                path: ["end_date"],
            });
        }
        if (startDate >= endDate) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Start Date must be before End Date.",
                path: ["start_date"],
            });
        }
    }

    // Cross-field validation: collection_day must be strictly before payout_day
    if (data.collection_day && data.payout_day) {
        if (data.collection_day >= data.payout_day) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Collection Day must be before Payout Day.",
                path: ["collection_day"],
            });
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Payout Day must be after Collection Day.",
                path: ["payout_day"],
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
