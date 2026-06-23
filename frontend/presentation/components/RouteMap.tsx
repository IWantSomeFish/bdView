import React, { useState, useMemo } from 'react';
import type { Route } from '../../domain/types';
import RouteTree, { type RouteSelection } from './RouteTree';
import MapCanvas, { type MapPath } from './MapCanvas';

interface Props {
  routes: Route[];
}

const COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22'];
const MAX_GAP_MS = 5 * 60 * 1000;

const RouteMap: React.FC<Props> = ({ routes }) => {
  const [selection, setSelection] = useState<RouteSelection>({
    routeId: routes[0]?.routeId,
    segmentId: null,
    calibrationId: null,
  });
  const [expandedRoutes, setExpandedRoutes] = useState<Set<string>>(new Set([routes[0]?.routeId]));
  const [expandedSegments, setExpandedSegments] = useState<Set<string>>(new Set());

  const selectedRoute = routes.find(r => r.routeId === selection.routeId);

  const { center, fingerprints, segmentColors, segmentPaths } = useMemo(() => {
    if (!selectedRoute) return { center: [56.9932, 40.9809] as [number, number], fingerprints: [], segmentColors: {}, segmentPaths: [] };

    let segments = selection.segmentId
      ? selectedRoute.segments.filter(s => s.segmentId === selection.segmentId)
      : selectedRoute.segments;

    if (selection.calibrationId) {
      segments = segments.map(seg => ({
        ...seg,
        calibrations: seg.calibrations?.filter(c => c.runId === selection.calibrationId) ?? []
      }));
    }

    const fps = segments
      .flatMap(seg => (seg.calibrations ?? []).flatMap(cal => cal.snapshots ?? []))
      .filter(fp => typeof fp.gpsLatitude === 'number' && !isNaN(fp.gpsLatitude) && !isNaN(fp.gpsLongitude));

    const colors: Record<string, string> = {};
    selectedRoute.segments.forEach((seg, i) => { colors[seg.segmentId] = COLORS[i % COLORS.length]; });

    const c: [number, number] = fps.length > 0 ? [fps[0].gpsLatitude, fps[0].gpsLongitude] : [56.9932, 40.9809];

    const paths: MapPath[] = segments.flatMap(seg => {
      const sorted = (seg.calibrations ?? [])
        .flatMap(cal => cal.snapshots ?? [])
        .filter(fp => typeof fp.gpsLatitude === 'number' && !isNaN(fp.gpsLatitude))
        .sort((a, b) => a.gpsTimestamp - b.gpsTimestamp);

      if (sorted.length < 2) return [];

      const groups: typeof sorted[] = [];
      let cur: typeof sorted = [sorted[0]];
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].gpsTimestamp - sorted[i - 1].gpsTimestamp > MAX_GAP_MS) { groups.push(cur); cur = [sorted[i]]; }
        else cur.push(sorted[i]);
      }
      groups.push(cur);

      return groups.filter(g => g.length > 1).map((g, idx) => ({
        segmentId: `${seg.segmentId}-${idx}`,
        color: colors[seg.segmentId],
        points: g.map(fp => [fp.gpsLatitude, fp.gpsLongitude] as [number, number]),
      }));
    });

    return { center: c, fingerprints: fps, segmentColors: colors, segmentPaths: paths };
  }, [selectedRoute, selection.segmentId, selection.calibrationId]);

  const toggle = (set: Set<string>, key: string, setter: React.Dispatch<React.SetStateAction<Set<string>>>) => {
    const next = new Set(set);
    next.has(key) ? next.delete(key) : next.add(key);
    setter(next);
  };

  const breadcrumb = [
    selectedRoute?.name || selection.routeId,
    selection.segmentId && selectedRoute?.segments.find(s => s.segmentId === selection.segmentId)?.name,
    selection.calibrationId && `Калибровка ${new Date(selectedRoute?.segments.find(s => s.segmentId === selection.segmentId)?.calibrations?.find(c => c.runId === selection.calibrationId)?.startedAtMillis ?? 0).toLocaleDateString()}`,
  ].filter(Boolean).join(' → ');

  const legend = (selectedRoute?.segments ?? []).map((seg, i) => ({
    segmentId: seg.segmentId,
    name: seg.name || seg.segmentId,
    color: COLORS[i % COLORS.length],
  }));

  if (!selectedRoute) return <p>Нет маршрутов для отображения</p>;

  return (
    <div style={{ marginTop: '20px', display: 'flex', gap: '15px' }}>
      <RouteTree
        routes={routes}
        selection={selection}
        segmentColors={segmentColors}
        expandedRoutes={expandedRoutes}
        expandedSegments={expandedSegments}
        onSelectRoute={id => setSelection({ routeId: id, segmentId: null, calibrationId: null })}
        onSelectSegment={(routeId, segmentId) => setSelection({ routeId, segmentId, calibrationId: null })}
        onSelectCalibration={(routeId, segmentId, calibrationId) => setSelection({ routeId, segmentId, calibrationId })}
        onToggleRoute={id => toggle(expandedRoutes, id, setExpandedRoutes)}
        onToggleSegment={id => toggle(expandedSegments, id, setExpandedSegments)}
      />
      <MapCanvas
        center={center}
        fingerprints={fingerprints}
        segmentColors={segmentColors}
        segmentPaths={segmentPaths}
        breadcrumb={breadcrumb}
        legend={legend}
      />
    </div>
  );
};

export default RouteMap;
