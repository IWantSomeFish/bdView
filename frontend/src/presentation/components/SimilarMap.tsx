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
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set([groups[0]?.id ?? -1]));

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
        const pts: [number, number][] = [];
        for (const seg of route.segments) {
          for (const cal of seg.calibrations) {
            const p = pointsByRunId.get(cal.runId);
            if (p) pts.push(...p);
          }
        }
        return { routeId: route.routeId, name: route.name, points: pts };
      });
      const allPoints = routeLayers.flatMap(r => r.points);
      return { id: group.id, color, routeLayers, allPoints };
    });
  }, [groups, pointsByRunId]);

  const selectedGroup = groupLayers.find(g => g.id === selectedGroupId);

  const visiblePoints = useMemo(() => {
    if (!selectedGroup) return groupLayers.flatMap(g => g.allPoints.map(p => ({ pt: p, color: g.color })));
    if (selectedRouteId) {
      const route = selectedGroup.routeLayers.find(r => r.routeId === selectedRouteId);
      return (route?.points ?? []).map(p => ({ pt: p, color: selectedGroup.color }));
    }
    return selectedGroup.allPoints.map(p => ({ pt: p, color: selectedGroup.color }));
  }, [selectedGroup, selectedRouteId, groupLayers]);

  const center = useMemo((): [number, number] => {
    const first = visiblePoints[0];
    return first ? first.pt : [56.9932, 40.9809];
  }, [visiblePoints]);

  const toggle = (set: Set<any>, key: any, setter: React.Dispatch<React.SetStateAction<Set<any>>>) => {
    const next = new Set(set);
    next.has(key) ? next.delete(key) : next.add(key);
    setter(next);
  };

  return (
    <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
      <div style={{ width: '300px', flexShrink: 0, border: '1px solid var(--border)', borderRadius: '4px', padding: '10px', maxHeight: '610px', overflowY: 'auto' }}>
        {groupLayers.map(group => {
          const isExpanded = expandedGroups.has(group.id);
          const isSelected = group.id === selectedGroupId && !selectedRouteId;
          return (
            <div key={group.id} style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => toggle(expandedGroups, group.id, setExpandedGroups as any)}
                  style={{ width: '20px', height: '20px', border: '1px solid #999', background: 'transparent', cursor: 'pointer', fontSize: '12px', padding: 0 }}
                >
                  {isExpanded ? '−' : '+'}
                </button>
                <button
                  onClick={() => { setSelectedGroupId(group.id); setSelectedRouteId(null); }}
                  style={{ flex: 1, padding: '6px 10px', border: 'none', background: isSelected ? group.color : 'transparent', color: isSelected ? 'white' : 'var(--text)', textAlign: 'left', cursor: 'pointer', borderRadius: '3px', fontWeight: isSelected ? 'bold' : 'normal', borderLeft: `4px solid ${group.color}` }}
                >
                  Группа #{group.id} · {group.routeLayers.length} маршр. · {group.allPoints.length} точек
                </button>
              </div>

              {isExpanded && (
                <div style={{ marginLeft: '28px', marginTop: '4px' }}>
                  {group.routeLayers.map(route => {
                    const isRouteSelected = group.id === selectedGroupId && selectedRouteId === route.routeId;
                    return (
                      <div key={route.routeId} style={{ marginBottom: '2px' }}>
                        <button
                          onClick={() => { setSelectedGroupId(group.id); setSelectedRouteId(route.routeId); }}
                          style={{ width: '100%', padding: '4px 8px', border: 'none', background: isRouteSelected ? '#e3f2fd' : 'transparent', textAlign: 'left', cursor: 'pointer', borderRadius: '3px', fontSize: '13px' }}
                        >
                          {route.name || route.routeId} ({route.points.length} точек)
                        </button>
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
          {selectedGroup
            ? <>Группа #{selectedGroup.id}{selectedRouteId && ` → ${selectedGroup.routeLayers.find(r => r.routeId === selectedRouteId)?.name}`}</>
            : 'Все группы'
          }
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
              <Tooltip>{selectedGroup ? `Группа #${selectedGroup.id}` : ''}</Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default SimilarMap;
