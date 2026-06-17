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

export type CalibrationRef = {
    runId: string;
    routeId: string;
    segmentId: string;

    similarityScore?: number;
};

export type CalibrationGroup = {
    id: string;

    calibrations: CalibrationRef[];
}

type DisplaySegment = {
    segmentId: string;

    calibrations: CalibrationRef[];
};

type DisplayRoute = {
    routeId: string;

    segments: DisplaySegment[];
};

type DisplayRouteGroup = {
    id: string;

    routes: DisplayRoute[];
};