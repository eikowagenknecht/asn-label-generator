import { z } from "zod";
import { labelInfo } from "../config/avery-labels";

export const cliOptionsSchema = z.object({
  startAsn: z.number().int().positive().default(1),
  format: z.string().refine((val) => Object.keys(labelInfo).includes(val), {
    message: "Invalid label format",
  }),
  outputFile: z.string().default("labels.pdf"),
  debug: z.boolean().default(false),
  rowWise: z.boolean().default(true),
  numLabels: z.number().int().positive().optional(),
  pages: z.number().int().positive().default(1),
  digits: z.number().int().positive().default(7),
});
