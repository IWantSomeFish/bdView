import React from 'react';
import type { Route } from '../../domain/types';

export interface RouteSelection {
  routeId: string;
  segmentId: string | null;
  calibrationId: string | null;
}

interface Props {
  routes: Route[];
  selection: RouteSelection;
  segmentColors: Record<string, string>;
  expandedRoutes: Set<string>;
  expandedSegments: Set<string>;
  onSelectRoute: (routeId: string) => void;
  onSelectSegment: (routeId: string, segmentId: string | null) => void;
  onSelectCalibration: (routeId: string, segmentId: string, calibrationId: string) => void;
  onToggleRoute: (routeId: string) => void;
  onToggleSegment: (segmentId: string) => void;
}

const RouteTree: React.FC<Props> = ({
  routes, selection, segmentColors,
  expandedRoutes, expandedSegments,
  onSelectRoute, onSelectSegment, onSelectCalibration,
  onToggleRoute, onToggleSegment,
}) => (
  <div style={{ width: '300px', flexShrink: 0, border: '1px solid var(--border)', borderRadius: '4px', padding: '10px', maxHeight: '610px', overflowY: 'auto' }}>
    {routes.map((route) => {
      const isExpanded = expandedRoutes.has(route.routeId);
      const isRouteSelected = route.routeId === selection.routeId;
      return (
        <div key={route.routeId} style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={() => onToggleRoute(route.routeId)}
              style={{ width: '20px', height: '20px', border: '1px solid #999', background: 'transparent', cursor: 'pointer', fontSize: '12px', padding: 0 }}>
              {isExpanded ? '−' : '+'}
            </button>
            <button onClick={() => onSelectRoute(route.routeId)}
              style={{ flex: 1, padding: '6px 10px', border: 'none', background: isRouteSelected && !selection.segmentId ? '#007bff' : 'transparent', color: isRouteSelected && !selection.segmentId ? 'white' : 'var(--text)', textAlign: 'left', cursor: 'pointer', borderRadius: '3px', fontWeight: isRouteSelected ? 'bold' : 'normal' }}>
              {route.name || route.routeId}
            </button>
          </div>
          {isExpanded && (
            <div style={{ marginLeft: '28px', marginTop: '4px' }}>
              <div onClick={() => onSelectSegment(route.routeId, null)}
                style={{ padding: '4px 8px', cursor: 'pointer', background: isRouteSelected && !selection.segmentId ? '#e3f2fd' : 'transparent', borderRadius: '3px', fontSize: '13px', marginBottom: '2px' }}>
                ✓ Весь маршрут ({(route.segments ?? []).reduce((sum, s) => sum + (s.calibrations?.reduce((cSum, c) => cSum + (c.snapshots?.length ?? 0), 0) ?? 0), 0)} точек)
              </div>
              {(route.segments ?? []).map((seg) => {
                const isSegSelected = isRouteSelected && selection.segmentId === seg.segmentId && !selection.calibrationId;
                const isSegExpanded = expandedSegments.has(seg.segmentId);
                return (
                  <div key={seg.segmentId} style={{ marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button onClick={() => onToggleSegment(seg.segmentId)}
                        style={{ width: '16px', height: '16px', border: '1px solid #999', background: 'transparent', cursor: 'pointer', fontSize: '10px', padding: 0 }}>
                        {isSegExpanded ? '−' : '+'}
                      </button>
                      <div onClick={() => onSelectSegment(route.routeId, seg.segmentId)}
                        style={{ flex: 1, padding: '4px 8px', cursor: 'pointer', background: isSegSelected ? '#e3f2fd' : 'transparent', borderRadius: '3px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '10px', height: '10px', backgroundColor: segmentColors[seg.segmentId], borderRadius: '50%' }} />
                        {seg.name || seg.segmentId} ({(seg.calibrations?.reduce((sum, c) => sum + (c.snapshots?.length ?? 0), 0) ?? 0)} точек)
                      </div>
                    </div>
                    {isSegExpanded && (
                      <div style={{ marginLeft: '20px', marginTop: '2px' }}>
                        {(seg.calibrations ?? []).map((cal) => {
                          const isCalSelected = isRouteSelected && selection.segmentId === seg.segmentId && selection.calibrationId === cal.runId;
                          return (
                            <div key={cal.runId} onClick={() => onSelectCalibration(route.routeId, seg.segmentId, cal.runId)}
                              style={{ padding: '3px 6px', cursor: 'pointer', background: isCalSelected ? '#e3f2fd' : 'transparent', borderRadius: '3px', fontSize: '12px', marginBottom: '1px' }}>
                              {new Date(cal.startedAtMillis).toLocaleDateString()} — {cal.source ?? 'N/A'} ({cal.snapshots?.length ?? 0} точек)
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
);

export default RouteTree;
