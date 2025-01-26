import { z } from "zod";
import { labelInfo } from "../config/avery-labels";

export const cliOptionsSchema = z.object({
  startAsn: z.number().int().positive().default(1),
  format: z
    .string()
    .default("averyL4731")
    .refine((val) => Object.keys(labelInfo).includes(val), {
      message: "Invalid label format",
    }),
  outputFile: z.string().default("labels.pdf"),
  debug: z.boolean().default(false),
  rowWise: z.boolean().default(true),
  numLabels: z.number().int().positive().optional(),
  pages: z.number().int().positive().default(1),
  digits: z.number().int().positive().default(7),
  prefix: z.string().default("ASN"),
  offsetX: z.number().default(0), // Float, can be negative
  offsetY: z.number().default(0), // Float, can be negative
  scaleX: z.number().default(1), // Float, can be negative
  scaleY: z.number().default(1), // Float, can be negative
  marginX: z.number().nonnegative().default(0), // Float
  marginY: z.number().nonnegative().default(0), // Float
});
