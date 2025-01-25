import { z } from "zod";
import { labelInfo } from "../config/avery-labels";

const startPositionRegex = /^(\d{1,2}):(\d{1,2})$/;

export const cliOptionsSchema = z.object({
  format: z.string().refine((val) => Object.keys(labelInfo).includes(val), {
    message: "Invalid label format",
  }),
  outputFile: z.string().default("labels.pdf"),
  debug: z.boolean().default(false),
  rowWise: z.boolean().default(true),
  numLabels: z.number().int().positive().optional(),
  pages: z.number().int().positive().default(1),
  startPosition: z
    .union([z.string().regex(startPositionRegex), z.number().int().positive()])
    .optional(),
});

// export type CLIOptions = z.infer<typeof cliOptionsSchema>;
