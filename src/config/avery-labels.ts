import type { LabelInfo } from "../types/label-info";

// Conversion factors
const MM_TO_POINTS = 2.83465;
const INCH_TO_POINTS = 72;

// Standard page sizes defined in their natural units (mm for A4, inches for LETTER)
// and then converted to points
const A4: [number, number] = [
  210 * MM_TO_POINTS, // 210mm width
  297 * MM_TO_POINTS, // 297mm height
];

const LETTER: [number, number] = [
  8.5 * INCH_TO_POINTS, // 8.5 inches width
  11 * INCH_TO_POINTS, // 11 inches height
];

export const labelInfo: Record<string, LabelInfo> = {
  averyL4731: {
    labelsHorizontal: 7,
    labelsVertical: 27,
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
    pageSize: A4,
  },
  avery5160: {
    labelsHorizontal: 3,
    labelsVertical: 10,
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
    pageSize: LETTER,
  },
  // Adding avery5167 to make use of INCH_TO_POINTS
  avery5167: {
    labelsHorizontal: 4,
    labelsVertical: 20,
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
    pageSize: LETTER,
  },
} as const;
