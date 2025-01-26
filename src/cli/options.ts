import { z } from "zod";
import { labelInfo } from "../config/avery-labels";

export const cliOptionsSchema = z.object({
  startAsn: z.number().int().positive(),
  format: z.string().refine((val) => Object.keys(labelInfo).includes(val), {
    message: "Invalid label format",
  }),
  outputFile: z.string(),
  border: z.boolean(),
  topDown: z.boolean(),
  numLabels: z.number().int().positive().optional(),
  pages: z.number().int().positive(),
  digits: z.number().int().positive(),
  skip: z.number().int().nonnegative(),
  prefix: z.string(),
  offsetX: z.number(), // Float, can be negative
  offsetY: z.number(), // Float, can be negative
  scaleX: z.number(), // Float, can be negative
  scaleY: z.number(), // Float, can be negative
  marginX: z.number().nonnegative(), // Float
  marginY: z.number().nonnegative(), // Float
});
