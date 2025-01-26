import { MM_TO_POINTS } from "@/util/const";
import type { LabelInfo } from "../types/label-info";

export const labelInfo: Record<string, LabelInfo> = {
  averyL4731: {
    labelsX: 7,
    labelsY: 27,
    labelSize: {
      width: 25.4 * MM_TO_POINTS,
      height: 10 * MM_TO_POINTS,
    },
    gutterSize: {
      x: 2.5 * MM_TO_POINTS,
      y: 0,
    },
    margin: {
      top: 13.5 * MM_TO_POINTS,
      left: 9 * MM_TO_POINTS,
    },
    pageSize: "A4",
  },
} as const;
