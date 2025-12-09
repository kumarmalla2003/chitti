import { z } from "zod";

export const assignmentSchema = z.object({
    member_id: z.union([z.string(), z.number()]).transform((val) => String(val)),
    chit_id: z.union([z.string(), z.number()]).transform((val) => String(val)),
    chit_month: z.string().min(1, "Month is required"),
});
