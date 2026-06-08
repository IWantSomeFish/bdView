export const REQUIRED_TABLES = [
    "routes",
    "route_segments",
    "wifi_fingerprints",
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
    wifi_fingerprints: [
        "fingerprintId",
        "routeId",
        "segmentId",
        "calibrationRunId",
        "ssid",
        "bssid",
        "signalDbm",
        "latitude",
        "longitude",
        "floorLevel",
        "recordedAt",
        "confidence"
    ]
}