import type { LabelInfo } from "../types/label-info";

export const labelInfo: Record<string, LabelInfo> = {
  averyL4731: {
    pageFormat: "a4", // See https://artskydj.github.io/jsPDF/docs/jsPDF.html for supported formats
    numLabels: {
      x: 7,
      y: 27,
    },
    labelSizeInMm: {
      width: 25.4,
      height: 10,
    },
    gutterSizeInMm: {
      x: 2.5,
      y: 0,
    },
    marginInMm: {
      top: 13.5,
      left: 9,
    },
  },
} as const;
