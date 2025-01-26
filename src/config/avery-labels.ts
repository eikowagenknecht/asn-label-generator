import { INCH_TO_POINTS, MM_TO_POINTS } from "@/util/const";
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
  avery5160: {
    labelsX: 3,
    labelsY: 10,
    labelSize: {
      width: 2.6 * INCH_TO_POINTS,
      height: 1 * INCH_TO_POINTS,
    },
    gutterSize: {
      x: (1 / 6) * INCH_TO_POINTS,
      y: 0,
    },
    margin: {
      top: 0.5 * INCH_TO_POINTS,
      left: 0.19 * INCH_TO_POINTS,
    },
    pageSize: "LETTER",
  },
  // Adding avery5167 to make use of INCH_TO_POINTS
  avery5167: {
    labelsX: 4,
    labelsY: 20,
    labelSize: {
      width: 1.75 * INCH_TO_POINTS,
      height: 0.5 * INCH_TO_POINTS,
    },
    gutterSize: {
      x: 0.3 * INCH_TO_POINTS,
      y: 0,
    },
    margin: {
      top: 0.5 * INCH_TO_POINTS,
      left: 0.3 * INCH_TO_POINTS,
    },
    pageSize: "LETTER",
  },
} as const;
