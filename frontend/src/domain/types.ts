export interface RawCalibrationSnapshot {
  snapshotId: string;
  calibrationRunId: string;
  routeId: string;
  segmentId: string;
  recordedAt: number;
  wifiNetworksJson: string;
  gpsLatitude: number;
  gpsLongitude: number;
  gpsAccuracy: number | null;
  gpsSpeed: number | null;
  gpsTimestamp: number | null;
  wasRecordedToMainTable: number;
  gpsQuality: string | null;
  notes: string | null;
}

export interface CalibrationRun {
  runId: string;
  routeId: string;
  segmentId: string;
  startedAtMillis: number;
  finishedAtMillis: number;
  operator: string | null;
  notes: string | null;
  source: string | null;
  isActive: number;
  snapshotPoints: RawCalibrationSnapshot[];
}

export interface RouteSegment {
  segmentId: string;
  routeId: string;
  startFingerprintId: string;
  endFingerprintId: string;
  distanceMeters: number;
  version: number;
  confidence: number;
  updatedAt: number;
  name: string;
  isReturn: number;
  calibrations: CalibrationRun[];
}

export interface Route {
  routeId: string;
  name: string;
  lastCalibratedAt: number;
  version: number;
  createdAt: number;
  updatedAt: number;
  notes: string;
  useGps: number;
  externalRouteId: string;
  enableTrackDetailization: number;
  routeSegments: RouteSegment[];
}

export type ParseResult = Route[];
