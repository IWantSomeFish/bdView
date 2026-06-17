import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Polyline } from 'react-leaflet';
import type { Route } from '../../domain/types';

interface Props {
  routes: Route[];
}

const COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22'];

const RouteMap: React.FC<Props> = ({ routes }) => {
  const [selectedRouteId, setSelectedRouteId] = useState(routes[0]?.routeId);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [selectedCalibrationId, setSelectedCalibrationId] = useState<string | null>(null);
  const [expandedRoutes, setExpandedRoutes] = useState<Set<string>>(new Set([routes[0]?.routeId]));
  const [expandedSegments, setExpandedSegments] = useState<Set<string>>(new Set());

  const selectedRoute = routes.find((r) => r.routeId === selectedRouteId);

  const { center, fingerprints, segmentColors, segmentPaths } = useMemo(() => {
    if (!selectedRoute) return { center: [56.9932, 40.9809] as [number, number], fingerprints: [], segmentColors: {}, segmentPaths: [] };

    let segments = selectedSegmentId
      ? selectedRoute.routeSegments.filter(s => s.segmentId === selectedSegmentId)
      : selectedRoute.routeSegments;

    // Если выбрана калибровка — фильтруем
    if (selectedCalibrationId) {
      segments = segments.map(seg => ({
        ...seg,
        calibrations: seg.calibrations?.filter(c => c.runId === selectedCalibrationId) ?? []
      }));
    }

    const fps = segments
      .flatMap((seg) => (seg.calibrations ?? []).flatMap(cal => cal.snapshotPoints ?? []))
      .filter((fp) => typeof fp.gpsLatitude === 'number' && typeof fp.gpsLongitude === 'number' && !isNaN(fp.gpsLatitude) && !isNaN(fp.gpsLongitude));

    const colors: Record<string, string> = {};
    selectedRoute.routeSegments.forEach((seg, i) => {
      colors[seg.segmentId] = COLORS[i % COLORS.length];
    });

    const c: [number, number] = fps.length > 0 ? [fps[0].gpsLatitude, fps[0].gpsLongitude] : [56.9932, 40.9809];

    const paths = segments.flatMap(seg => {
      const sorted = (seg.calibrations ?? [])
        .flatMap(cal => cal.snapshotPoints ?? [])
        .filter(fp => typeof fp.gpsLatitude === 'number' && typeof fp.gpsLongitude === 'number' && !isNaN(fp.gpsLatitude) && !isNaN(fp.gpsLongitude))
        .sort((a, b) => a.recordedAt - b.recordedAt);

      if (sorted.length < 2) return [];

      const MAX_GAP_MS = 5 * 60 * 1000;
      const groups: typeof sorted[] = [];
      let currentGroup: typeof sorted = [sorted[0]];

      for (let i = 1; i < sorted.length; i++) {
        const timeDiff = sorted[i].recordedAt - sorted[i - 1].recordedAt;
        if (timeDiff > MAX_GAP_MS) {
          groups.push(currentGroup);
          currentGroup = [sorted[i]];
        } else {
          currentGroup.push(sorted[i]);
        }
      }
      groups.push(currentGroup);

      return groups
        .filter(g => g.length > 1)
        .map((group, idx) => ({
          segmentId: `${seg.segmentId}-${idx}`,
          color: colors[seg.segmentId],
          points: group.map(fp => [fp.gpsLatitude, fp.gpsLongitude] as [number, number])
        }));
    });

    return { center: c, fingerprints: fps, segmentColors: colors, segmentPaths: paths };
  }, [selectedRoute, selectedSegmentId, selectedCalibrationId]);

  const toggleRoute = (routeId: string) => {
    const newExpanded = new Set(expandedRoutes);
    if (newExpanded.has(routeId)) {
      newExpanded.delete(routeId);
    } else {
      newExpanded.add(routeId);
    }
    setExpandedRoutes(newExpanded);
  };

  const toggleSegment = (segmentId: string) => {
    const newExpanded = new Set(expandedSegments);
    if (newExpanded.has(segmentId)) {
      newExpanded.delete(segmentId);
    } else {
      newExpanded.add(segmentId);
    }
    setExpandedSegments(newExpanded);
  };

  const selectRoute = (routeId: string) => {
    setSelectedRouteId(routeId);
    setSelectedSegmentId(null);
    setSelectedCalibrationId(null);
  };

  const selectSegment = (routeId: string, segmentId: string | null) => {
    setSelectedRouteId(routeId);
    setSelectedSegmentId(segmentId);
    setSelectedCalibrationId(null);
  };

  const selectCalibration = (routeId: string, segmentId: string, calibrationId: string) => {
    setSelectedRouteId(routeId);
    setSelectedSegmentId(segmentId);
    setSelectedCalibrationId(calibrationId);
  };

  if (!selectedRoute) return <p>Нет маршрутов для отображения</p>;

  return (
    <div style={{ marginTop: '20px', display: 'flex', gap: '15px' }}>
      <div style={{
        width: '300px',
        flexShrink: 0,
        border: '1px solid var(--border)',
        borderRadius: '4px',
        padding: '10px',
        maxHeight: '610px',
        overflowY: 'auto'
      }}>
        {routes.map((route) => {
          const isExpanded = expandedRoutes.has(route.routeId);
          const isRouteSelected = route.routeId === selectedRouteId;
          return (
            <div key={route.routeId} style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => toggleRoute(route.routeId)}
                  style={{
                    width: '20px',
                    height: '20px',
                    border: '1px solid #999',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '12px',
                    padding: 0
                  }}
                >
                  {isExpanded ? '−' : '+'}
                </button>
                <button
                  onClick={() => selectRoute(route.routeId)}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    border: 'none',
                    background: isRouteSelected && !selectedSegmentId ? '#007bff' : 'transparent',
                    color: isRouteSelected && !selectedSegmentId ? 'white' : 'var(--text)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderRadius: '3px',
                    fontWeight: isRouteSelected ? 'bold' : 'normal'
                  }}
                >
                  {route.name || route.routeId}
                </button>
              </div>
              {isExpanded && (
                <div style={{ marginLeft: '28px', marginTop: '4px' }}>
                  <div
                    onClick={() => selectSegment(route.routeId, null)}
                    style={{
                      padding: '4px 8px',
                      cursor: 'pointer',
                      background: isRouteSelected && !selectedSegmentId ? '#e3f2fd' : 'transparent',
                      borderRadius: '3px',
                      fontSize: '13px',
                      marginBottom: '2px'
                    }}
                  >
                    ✓ Весь маршрут ({route.routeSegments.reduce((sum, s) => sum + (s.calibrations?.reduce((cSum, c) => cSum + (c.snapshotPoints?.length ?? 0), 0) ?? 0), 0)} точек)
                  </div>
                  {route.routeSegments.map((seg) => {
                    const isSegmentSelected = isRouteSelected && selectedSegmentId === seg.segmentId && !selectedCalibrationId;
                    const isSegmentExpanded = expandedSegments.has(seg.segmentId);
                    return (
                      <div key={seg.segmentId} style={{ marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <button
                            onClick={() => toggleSegment(seg.segmentId)}
                            style={{
                              width: '16px',
                              height: '16px',
                              border: '1px solid #999',
                              background: 'transparent',
                              cursor: 'pointer',
                              fontSize: '10px',
                              padding: 0
                            }}
                          >
                            {isSegmentExpanded ? '−' : '+'}
                          </button>
                          <div
                            onClick={() => selectSegment(route.routeId, seg.segmentId)}
                            style={{
                              flex: 1,
                              padding: '4px 8px',
                              cursor: 'pointer',
                              background: isSegmentSelected ? '#e3f2fd' : 'transparent',
                              borderRadius: '3px',
                              fontSize: '13px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <div style={{ width: '10px', height: '10px', backgroundColor: segmentColors[seg.segmentId], borderRadius: '50%' }} />
                            {seg.name || seg.segmentId} ({(seg.calibrations?.reduce((sum, c) => sum + (c.snapshotPoints?.length ?? 0), 0) ?? 0)} точек)
                          </div>
                        </div>
                        {isSegmentExpanded && (
                          <div style={{ marginLeft: '20px', marginTop: '2px' }}>
                            {(seg.calibrations ?? [])
                              .slice()
                              .sort((a, b) => {
                                if (a.source === 'AUTO_OPTIMIZED' && b.source !== 'AUTO_OPTIMIZED') return -1;
                                if (a.source !== 'AUTO_OPTIMIZED' && b.source === 'AUTO_OPTIMIZED') return 1;
                                return 0;
                              })
                              .map((cal) => {
                              const isCalSelected = isRouteSelected && selectedSegmentId === seg.segmentId && selectedCalibrationId === cal.runId;
                              return (
                                <div
                                  key={cal.runId}
                                  onClick={() => selectCalibration(route.routeId, seg.segmentId, cal.runId)}
                                  style={{
                                    padding: '3px 6px',
                                    cursor: 'pointer',
                                    background: isCalSelected ? '#e3f2fd' : 'transparent',
                                    borderRadius: '3px',
                                    fontSize: '12px',
                                    marginBottom: '1px'
                                  }}
                                >
                                  {new Date(cal.startedAtMillis).toLocaleDateString()} — {cal.source ?? 'N/A'} ({cal.snapshotPoints?.length ?? 0} точек)
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '10px', fontSize: '14px' }}>
          <strong>{selectedRoute.name || selectedRoute.routeId}</strong>
          {selectedSegmentId && ` → ${selectedRoute.routeSegments.find(s => s.segmentId === selectedSegmentId)?.name || selectedSegmentId}`}
          {selectedCalibrationId && ` → Калибровка ${new Date(selectedRoute.routeSegments.find(s => s.segmentId === selectedSegmentId)?.calibrations?.find(c => c.runId === selectedCalibrationId)?.startedAtMillis ?? 0).toLocaleDateString()}`}
          {' — '}{fingerprints.length} точек GPS
        </div>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '8px', fontSize: '13px' }}>
          {selectedRoute.routeSegments.map((seg) => (
            <div key={seg.segmentId} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: segmentColors[seg.segmentId] }} />
              {seg.name || seg.segmentId}
            </div>
          ))}
        </div>

        <MapContainer center={center} zoom={14} style={{ height: '600px', width: '100%', borderRadius: '8px' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          {segmentPaths.map((path) => (
            <Polyline
              key={path.segmentId}
              positions={path.points}
              pathOptions={{ color: path.color || '#999', weight: 3, opacity: 0.8 }}
            />
          ))}
          {fingerprints.map((fp) => (
            <CircleMarker
              key={fp.snapshotId}
              center={[fp.gpsLatitude, fp.gpsLongitude]}
              radius={4}
              pathOptions={{ color: segmentColors[fp.segmentId] || '#999', fillOpacity: 0.7, weight: 1 }}
            >
              <Tooltip>
                Точность GPS: {fp.gpsAccuracy ? `${fp.gpsAccuracy.toFixed(1)}m` : 'N/A'}
                <br />
                Время: {new Date(fp.recordedAt).toLocaleString()}
              </Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default RouteMap;
