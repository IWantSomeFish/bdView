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
  const [expandedRoutes, setExpandedRoutes] = useState<Set<string>>(new Set([routes[0]?.routeId]));

  const selectedRoute = routes.find((r) => r.routeId === selectedRouteId);

  const { center, fingerprints, segmentColors, segmentPaths } = useMemo(() => {
    if (!selectedRoute) return { center: [56.9932, 40.9809] as [number, number], fingerprints: [], segmentColors: {}, segmentPaths: [] };

    const segments = selectedSegmentId
      ? selectedRoute.routeSegments.filter(s => s.segmentId === selectedSegmentId)
      : selectedRoute.routeSegments;

    const fps = segments
      .flatMap((seg) => seg.wifiFingerprints)
      .filter((fp) => typeof fp.latitude === 'number' && typeof fp.longitude === 'number' && !isNaN(fp.latitude) && !isNaN(fp.longitude));

    const colors: Record<string, string> = {};
    selectedRoute.routeSegments.forEach((seg, i) => {
      colors[seg.segmentId] = COLORS[i % COLORS.length];
    });

    const c: [number, number] = fps.length > 0 ? [fps[0].latitude, fps[0].longitude] : [56.9932, 40.9809];

    const paths = segments.map(seg => {
      const points = seg.wifiFingerprints
        .filter(fp => typeof fp.latitude === 'number' && typeof fp.longitude === 'number' && !isNaN(fp.latitude) && !isNaN(fp.longitude))
        .sort((a, b) => a.recordedAt - b.recordedAt)
        .map(fp => [fp.latitude, fp.longitude] as [number, number]);
      console.log(`Segment ${seg.name || seg.segmentId}: ${points.length} valid points`);
      return { segmentId: seg.segmentId, points };
    }).filter(p => p.points.length > 1);

    console.log(`Rendering ${paths.length} polylines`);

    return { center: c, fingerprints: fps, segmentColors: colors, segmentPaths: paths };
  }, [selectedRoute, selectedSegmentId]);

  const toggleRoute = (routeId: string) => {
    const newExpanded = new Set(expandedRoutes);
    if (newExpanded.has(routeId)) {
      newExpanded.delete(routeId);
    } else {
      newExpanded.add(routeId);
    }
    setExpandedRoutes(newExpanded);
  };

  const selectRoute = (routeId: string) => {
    setSelectedRouteId(routeId);
    setSelectedSegmentId(null);
  };

  const selectSegment = (routeId: string, segmentId: string | null) => {
    setSelectedRouteId(routeId);
    setSelectedSegmentId(segmentId);
  };

  if (!selectedRoute) return <p>Нет маршрутов для отображения</p>;

  return (
    <div style={{ marginTop: '20px', display: 'flex', gap: '15px' }}>
      {/* Левая панель - список маршрутов */}
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
                    ✓ Весь маршрут ({route.routeSegments.reduce((sum, s) => sum + s.wifiFingerprints.length, 0)} точек)
                  </div>
                  {route.routeSegments.map((seg) => {
                    const isSegmentSelected = isRouteSelected && selectedSegmentId === seg.segmentId;
                    return (
                      <div
                        key={seg.segmentId}
                        onClick={() => selectSegment(route.routeId, seg.segmentId)}
                        style={{
                          padding: '4px 8px',
                          cursor: 'pointer',
                          background: isSegmentSelected ? '#e3f2fd' : 'transparent',
                          borderRadius: '3px',
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginBottom: '2px'
                        }}
                      >
                        <div style={{ width: '10px', height: '10px', backgroundColor: segmentColors[seg.segmentId], borderRadius: '50%' }} />
                        {seg.name || seg.segmentId} ({seg.wifiFingerprints.length} точек)
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Правая панель - карта */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '10px', fontSize: '14px' }}>
          <strong>{selectedRoute.name || selectedRoute.routeId}</strong>
          {selectedSegmentId && ` → ${selectedRoute.routeSegments.find(s => s.segmentId === selectedSegmentId)?.name || selectedSegmentId}`}
          {' — '}{fingerprints.length} точек WiFi
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
              pathOptions={{ color: segmentColors[path.segmentId] || '#999', weight: 3, opacity: 0.8 }}
            />
          ))}
          {fingerprints.map((fp) => (
            <CircleMarker
              key={fp.fingerprintId}
              center={[fp.latitude, fp.longitude]}
              radius={4}
              pathOptions={{ color: segmentColors[fp.segmentId] || '#999', fillOpacity: 0.7, weight: 1 }}
            >
              <Tooltip>
                <strong>{fp.ssid}</strong>
                <br />
                Сигнал: {fp.signalDbm} dBm
                <br />
                Сегмент: {fp.segmentId}
              </Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default RouteMap;
