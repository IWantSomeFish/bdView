import { H3Trajectory } from "../utils/trajectory/trajectory.types";

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

export type RouteGroup = {
    number: number;

    routes: GroupedRoute[];
};

export type GroupedRoute = {
    routeId: string;

    segments: GroupedSegment[];
};

export type GroupedSegment = {
    segmentId: string;

    calibrations: H3Trajectory[];
};