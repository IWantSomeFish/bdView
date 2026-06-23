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

// /similar response — Map<runId, similarRunIds[]> сериализованный в объект
export type SimilarResult = Record<string, string[]>;
