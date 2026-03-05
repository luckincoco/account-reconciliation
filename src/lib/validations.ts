import { z } from "zod";

export const transactionSchema = z.object({
  type: z.enum(["in", "out"]),
  counterpart_name: z.string().min(1, "required"),
  item_name: z.string().min(1, "required"),
  spec: z.string().optional().default(""),
  quantity: z.coerce.number().min(0, "min0"),
  unit: z.string().optional().default(""),
  unit_price: z.coerce.number().min(0, "min0"),
  amount: z.coerce.number().min(0.01, "minAmount"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "invalidDate"),
  source: z.enum(["manual", "photo", "voice"]).default("manual"),
});

export type TransactionFormData = z.infer<typeof transactionSchema>;

export const reconciliationSchema = z
  .object({
    date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "invalidDate"),
    date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "invalidDate"),
  })
  .refine((data) => data.date_from <= data.date_to, {
    message: "dateRangeInvalid",
    path: ["date_to"],
  });

export type ReconciliationFormData = z.infer<typeof reconciliationSchema>;
