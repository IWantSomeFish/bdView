import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Polyline } from 'react-leaflet';
import type { ParseResult, SimilarResult } from '../../domain/types';

interface Props {
  routes: ParseResult;
  groups: SimilarResult;
}

const GROUP_COLORS = [
  '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
  '#1abc9c', '#e67e22', '#e91e63', '#00bcd4', '#8bc34a',
];

const SimilarMap: React.FC<Props> = ({ routes, groups }) => {
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(groups[0]?.id ?? null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [selectedCalibrationId, setSelectedCalibrationId] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set([groups[0]?.id ?? -1]));
  const [expandedRoutes, setExpandedRoutes] = useState<Set<string>>(new Set());
  const [expandedSegments, setExpandedSegments] = useState<Set<string>>(new Set());

  const pointsByRunId = useMemo(() => {
    const map = new Map<string, [number, number][]>();
    for (const route of routes) {
      for (const seg of route.segments ?? []) {
        for (const cal of seg.calibrations ?? []) {
          const pts = (cal.snapshots ?? [])
            .filter(fp => typeof fp.gpsLatitude === 'number' && !isNaN(fp.gpsLatitude) && !isNaN(fp.gpsLongitude))
            .sort((a, b) => a.gpsTimestamp - b.gpsTimestamp)
            .map(fp => [fp.gpsLatitude, fp.gpsLongitude] as [number, number]);
          if (pts.length > 0) map.set(cal.runId, pts);
        }
      }
    }
    return map;
  }, [routes]);

  const groupLayers = useMemo(() => {
    return groups.map((group, idx) => {
      const color = GROUP_COLORS[idx % GROUP_COLORS.length];
      const routeLayers = group.routes.map(route => {
        const segmentLayers = (route.segments ?? []).map(seg => {
          const calibrationLayers = (seg.calibrations ?? []).map(cal => ({
            runId: cal.runId,
            startedAtMillis: cal.startedAtMillis,
            source: cal.source,
            stableNetworkCount: cal.stableNetworkCount,
            totalNetworkCount: cal.totalNetworkCount,
            points: pointsByRunId.get(cal.runId) ?? [],
          }));
          const segPoints = calibrationLayers.flatMap(c => c.points);
          return {
            segmentId: seg.segmentId,
            name: seg.name,
            calibrations: calibrationLayers,
            points: segPoints,
          };
        });
        const routePoints = segmentLayers.flatMap(s => s.points);
        return {
          routeId: route.routeId,
          name: route.name,
          segments: segmentLayers,
          points: routePoints,
        };
      });
      const allPoints = routeLayers.flatMap(r => r.points);
      return { id: group.id, color, routeLayers, allPoints };
    });
  }, [groups, pointsByRunId]);

  const selectedGroup = groupLayers.find(g => g.id === selectedGroupId);
  const selectedRoute = selectedGroup?.routeLayers.find(r => r.routeId === selectedRouteId);
  const selectedSegment = selectedRoute?.segments.find(s => s.segmentId === selectedSegmentId);
  const selectedCalibration = selectedSegment?.calibrations.find(c => c.runId === selectedCalibrationId);

  const visiblePoints = useMemo(() => {
    if (selectedCalibration) {
      return selectedCalibration.points.map(p => ({ pt: p, color: selectedGroup?.color ?? '#999' }));
    }
    if (selectedSegment) {
      return selectedSegment.points.map(p => ({ pt: p, color: selectedGroup?.color ?? '#999' }));
    }
    if (selectedRoute) {
      return selectedRoute.points.map(p => ({ pt: p, color: selectedGroup?.color ?? '#999' }));
    }
    if (selectedGroup) {
      return selectedGroup.allPoints.map(p => ({ pt: p, color: selectedGroup.color }));
    }
    return groupLayers.flatMap(g => g.allPoints.map(p => ({ pt: p, color: g.color })));
  }, [selectedGroup, selectedRoute, selectedSegment, selectedCalibration, groupLayers]);

  const center = useMemo((): [number, number] => {
    const first = visiblePoints[0];
    return first ? first.pt : [56.9932, 40.9809];
  }, [visiblePoints]);

  const breadcrumb = [
    selectedGroup ? `Группа #${selectedGroup.id}` : null,
    selectedRoute ? (selectedRoute.name || selectedRoute.routeId) : null,
    selectedSegment ? (selectedSegment.name || selectedSegment.segmentId) : null,
    selectedCalibration ? `Калибровка ${new Date(selectedCalibration.startedAtMillis).toLocaleDateString()}` : null,
  ].filter(Boolean).join(' → ');

  const toggle = <T,>(set: Set<T>, key: T, setter: (s: Set<T>) => void) => {
    const next = new Set(set);
    next.has(key) ? next.delete(key) : next.add(key);
    setter(next);
  };

  const selectGroup = (groupId: number) => {
    setSelectedGroupId(groupId);
    setSelectedRouteId(null);
    setSelectedSegmentId(null);
    setSelectedCalibrationId(null);
  };

  const selectRoute = (groupId: number, routeId: string) => {
    setSelectedGroupId(groupId);
    setSelectedRouteId(routeId);
    setSelectedSegmentId(null);
    setSelectedCalibrationId(null);
  };

  const selectSegment = (groupId: number, routeId: string, segmentId: string) => {
    setSelectedGroupId(groupId);
    setSelectedRouteId(routeId);
    setSelectedSegmentId(segmentId);
    setSelectedCalibrationId(null);
  };

  const selectCalibration = (groupId: number, routeId: string, segmentId: string, calId: string) => {
    setSelectedGroupId(groupId);
    setSelectedRouteId(routeId);
    setSelectedSegmentId(segmentId);
    setSelectedCalibrationId(calId);
  };

  return (
    <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
      <div style={{ width: '300px', flexShrink: 0, border: '1px solid var(--border)', borderRadius: '4px', padding: '10px', maxHeight: '610px', overflowY: 'auto' }}>
        {groupLayers.map(group => {
          const isExpanded = expandedGroups.has(group.id);
          const isSelectedGroup = group.id === selectedGroupId && !selectedRouteId;
          return (
            <div key={group.id} style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => toggle(expandedGroups, group.id, setExpandedGroups)}
                  style={{ width: '20px', height: '20px', border: '1px solid #999', background: 'transparent', cursor: 'pointer', fontSize: '12px', padding: 0 }}
                >
                  {isExpanded ? '−' : '+'}
                </button>
                <button
                  onClick={() => selectGroup(group.id)}
                  style={{ flex: 1, padding: '6px 10px', border: 'none', background: isSelectedGroup ? group.color : 'transparent', color: isSelectedGroup ? 'white' : 'var(--text)', textAlign: 'left', cursor: 'pointer', borderRadius: '3px', fontWeight: isSelectedGroup ? 'bold' : 'normal', borderLeft: `4px solid ${group.color}` }}
                >
                  Группа #{group.id} · {group.routeLayers.length} маршр. · {group.allPoints.length} точек
                </button>
              </div>

              {isExpanded && (
                <div style={{ marginLeft: '28px', marginTop: '4px' }}>
                  {group.routeLayers.map(route => {
                    const isExpandedRoute = expandedRoutes.has(route.routeId);
                    const isSelectedRoute = group.id === selectedGroupId && selectedRouteId === route.routeId && !selectedSegmentId;
                    return (
                      <div key={route.routeId} style={{ marginBottom: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <button
                            onClick={() => toggle(expandedRoutes, route.routeId, setExpandedRoutes)}
                            style={{ width: '16px', height: '16px', border: '1px solid #999', background: 'transparent', cursor: 'pointer', fontSize: '10px', padding: 0 }}
                          >
                            {isExpandedRoute ? '−' : '+'}
                          </button>
                          <button
                            onClick={() => selectRoute(group.id, route.routeId)}
                            style={{ flex: 1, padding: '4px 8px', border: 'none', background: isSelectedRoute ? '#e3f2fd' : 'transparent', textAlign: 'left', cursor: 'pointer', borderRadius: '3px', fontSize: '13px' }}
                          >
                            {route.name || route.routeId} ({route.points.length} точек)
                          </button>
                        </div>

                        {isExpandedRoute && (
                          <div style={{ marginLeft: '20px', marginTop: '2px' }}>
                            {route.segments.map(seg => {
                              const isExpandedSeg = expandedSegments.has(seg.segmentId);
                              const isSelectedSeg = group.id === selectedGroupId && selectedRouteId === route.routeId && selectedSegmentId === seg.segmentId && !selectedCalibrationId;
                              return (
                                <div key={seg.segmentId} style={{ marginBottom: '2px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <button
                                      onClick={() => toggle(expandedSegments, seg.segmentId, setExpandedSegments)}
                                      style={{ width: '14px', height: '14px', border: '1px solid #999', background: 'transparent', cursor: 'pointer', fontSize: '9px', padding: 0 }}
                                    >
                                      {isExpandedSeg ? '−' : '+'}
                                    </button>
                                    <button
                                      onClick={() => selectSegment(group.id, route.routeId, seg.segmentId)}
                                      style={{ flex: 1, padding: '3px 6px', border: 'none', background: isSelectedSeg ? '#e3f2fd' : 'transparent', textAlign: 'left', cursor: 'pointer', borderRadius: '3px', fontSize: '12px' }}
                                    >
                                      {seg.name || seg.segmentId} ({seg.calibrations.length} калибровок)
                                    </button>
                                  </div>

                                  {isExpandedSeg && (
                                    <div style={{ marginLeft: '18px', marginTop: '1px' }}>
                                      {seg.calibrations.map(cal => {
                                        const isSelectedCal = group.id === selectedGroupId && selectedRouteId === route.routeId && selectedSegmentId === seg.segmentId && selectedCalibrationId === cal.runId;
                                        return (
                                          <div
                                            key={cal.runId}
                                            onClick={() => selectCalibration(group.id, route.routeId, seg.segmentId, cal.runId)}
                                            style={{ padding: '2px 6px', cursor: 'pointer', background: isSelectedCal ? '#e3f2fd' : 'transparent', borderRadius: '3px', fontSize: '11px', marginBottom: '1px' }}
                                          >
                                            {new Date(cal.startedAtMillis).toLocaleDateString()} — {cal.source ?? 'N/A'} ({cal.snapshots?.length ?? 0} точек)
                                            {cal.stableNetworkCount != null && cal.totalNetworkCount != null && (
                                              <span style={{ color: '#27ae60', marginLeft: '4px' }}>
                                                · {cal.stableNetworkCount}/{cal.totalNetworkCount} стаб.
                                              </span>
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
        <div style={{ marginBottom: '8px', fontSize: '14px' }}>
          <strong>{breadcrumb || 'Все группы'}</strong>
          {' — '}{visiblePoints.length} точек
        </div>

        <MapContainer center={center} zoom={13} style={{ height: '600px', width: '100%', borderRadius: '8px' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          {visiblePoints.length > 1 && (
            <Polyline positions={visiblePoints.map(p => p.pt)} pathOptions={{ color: selectedGroup?.color ?? '#999', weight: 2, opacity: 0.6 }} />
          )}
          {visiblePoints.map((p, i) => (
            <CircleMarker key={i} center={p.pt} radius={3} pathOptions={{ color: p.color, fillOpacity: 0.6, weight: 1 }}>
              <Tooltip>{breadcrumb}</Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default SimilarMap;
