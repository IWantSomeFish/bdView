export interface WifiFingerprint {
  fingerprintId: string;
  routeId: string;
  segmentId: string;
  calibrationRunId: string;
  ssid: string;
  bssid: string;
  signalDbm: number;
  latitude: number;
  longitude: number;
  floorLevel: number | null;
  recordedAt: number;
  confidence: number;
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
  wifiFingerprints: WifiFingerprint[];
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
