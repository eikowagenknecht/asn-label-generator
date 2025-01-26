export interface Point {
  x: number;
  y: number;
}

export interface Spacing {
  x: number;
  y: number;
}

export interface ScaleFactor {
  x: number;
  y: number;
}

interface Dimensions {
  width: number;
  height: number;
}

interface PageMargins {
  top: number;
  left: number;
}

export interface LabelAdjustments {
  offset: Point;
  scale: ScaleFactor;
  margin: Spacing;
}

export interface LabelInfo {
  labelsX: number;
  labelsY: number;
  labelSize: Dimensions;
  gutterSize: Spacing;
  margin: PageMargins;
  pageSize: [number, number];
}

export interface LabelPosition {
  x: number;
  y: number;
}

export interface LabelGeneratorOptions {
  format: string;
  border: boolean;
  topDown: boolean;
  offset: Point;
  scale: ScaleFactor;
  margin: Spacing;
  skip: number;
  startAsn: number;
  digits: number;
  prefix: string;
}
