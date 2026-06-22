export interface CalibrationSnapshot {
  snapshotId: string;
  calibrationRunId: string;
  routeId: string;
  segmentId: string;
  gpsLatitude: number;
  gpsLongitude: number;
  gpsTimestamp: number;
}

export interface CalibrationRun {
  runId: string;
  routeId: string;
  segmentId: string;
  source: string | null;
  startedAtMillis: number;
  finishedAtMillis: number;
  snapshots: CalibrationSnapshot[];
}

export interface RouteSegment {
  segmentId: string;
  routeId: string;
  name?: string;
  isReturn?: number;
  calibrations: CalibrationRun[];
}

export interface Route {
  routeId: string;
  name?: string;
  segments: RouteSegment[];
}

export type ParseResult = Route[];

// /similar response types
export interface SimilarCalibration {
  runId: string;
  routeId: string;
  segmentId: string;
  startedAtMillis: number;
  finishedAtMillis: number;
  source: string | null;
  isActive: number;
}

export interface SimilarSegment {
  segmentId: string;
  routeId: string;
  name: string;
  isReturn: number;
  calibrations: SimilarCalibration[];
}

export interface SimilarRoute {
  routeId: string;
  name: string;
  segments: SimilarSegment[];
}

export interface SimilarGroup {
  id: number;
  routes: SimilarRoute[];
}

export type SimilarResult = SimilarGroup[];
