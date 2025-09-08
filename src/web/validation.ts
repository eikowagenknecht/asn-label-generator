import { z } from "zod";
import { labelInfo } from "../config/avery-labels";

export const webFormSchema = z.object({
  startAsn: z.number().int().positive(),
  format: z.string().refine((val) => Object.keys(labelInfo).includes(val), {
    message: "Invalid label format",
  }),
  border: z.boolean(),
  topDown: z.boolean(),
  numLabels: z
    .preprocess(
      (val) =>
        val === "" || val === null || val === undefined
          ? undefined
          : Number(val),
      z.number().int().positive(),
    )
    .optional(),
  pages: z.number().int().positive(),
  digits: z.number().int().positive(),
  skip: z.number().int().nonnegative(),
  prefixQR: z.string(),
  prefixPrint: z.string().optional(),
  offsetX: z.number(), // Float, can be negative
  offsetY: z.number(), // Float, can be negative
  scaleX: z.preprocess((val) => {
    const num = typeof val === "number" ? val : Number(val);
    return num / 100;
  }, z.number()), // Convert percentage to decimal
  scaleY: z.preprocess((val) => {
    const num = typeof val === "number" ? val : Number(val);
    return num / 100;
  }, z.number()), // Convert percentage to decimal
  marginX: z.number().nonnegative(), // Float
  marginY: z.number().nonnegative(), // Float
});

export type WebFormData = z.infer<typeof webFormSchema>;
