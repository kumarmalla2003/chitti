import { z } from "zod";

export const memberSchema = z.object({
    full_name: z.string().min(3, "Name must be at least 3 characters").max(100, "Name too long"),
    phone_number: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
});
