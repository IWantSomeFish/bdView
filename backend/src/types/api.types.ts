export const REQUIRED_TABLES = [
    "routes",
    "route_segments",
    "calibration_runs",
    "raw_calibration_snapshots"
] as const;

export const REQUIRED_COLUMNS = {
    routes: ["routeId",
      "name",
      "lastCalibratedAt",
      "version",
      "createdAt",
      "updatedAt",
      "notes",
      "useGps",
      "externalRouteId",
      "enableTrackDetailization",
    ],
    route_segments: [
        "segmentId",
        "routeId",
        "startFingerprintId",
        "endFingerprintId",
        "distanceMeters",
        "version",
        "confidence",
        "updatedAt",
        "name",
        "isReturn"
      ],
    calibration_runs: [
        "runId",
        "routeId",
        "segmentId",
        "startedAtMillis",
        "finishedAtMillis",
        "operator",
        "notes",
        "source",
        "isActive",
    ],
    raw_calibration_snapshots: [
        "snapshotId",
        "calibrationRunId",
        "routeId",
        "segmentId",
        "recordedAt",
        "wifiNetworksJson",
        "gpsLatitude",
        "gpsLongitude",
        "gpsAccuracy",
        "gpsSpeed",
        "gpsTimestamp",
        "wasRecordedToMainTable",
        "gpsQuality",
        "notes"
    ]
}

export interface CalibrationSnapshot {
    snapshotId: string,
    calibrationRunId: string,
    routeId: string,
    segmentId: string,
    gpsLatitude: number,
    gpsLongitude: number,
    gpsTimestamp: number,
}
export interface Calibration {
    runId: string,
    routeId: string,
    segmentId: string,
    source: string,
    startedAtMillis: number,
    finishedAtMillis: number,
    snapshots: CalibrationSnapshot[]
}
export interface Segment {
    segmentId: string,
    routeId: string,
    calibrations: Calibration[]
}
export interface Route {
    routeId: string,
    segments: Segment[],
}