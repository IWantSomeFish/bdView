import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Polyline } from 'react-leaflet';
import type { ParseResult, SimilarResult, CalibrationRun } from '../../domain/types';

interface Props {
  routes: ParseResult;
  groups: SimilarResult;
}

const GROUP_COLORS = [
  '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
  '#1abc9c', '#e67e22', '#e91e63', '#00bcd4', '#8bc34a',
];

const SimilarMap: React.FC<Props> = ({ routes, groups }) => {
  const clusters = useMemo(() => {
    const entries = Object.entries(groups).filter(([, similarIds]) => similarIds.length > 0);
    const visited = new Set<string>();
    const result: string[][] = [];
    for (const [runId, similarIds] of entries) {
      if (visited.has(runId)) continue;
      const cluster = [runId, ...similarIds.filter(id => !visited.has(id))];
      cluster.forEach(id => visited.add(id));
      result.push(cluster);
    }
    return result;
  }, [groups]);

  const [selectedClusterIdx, setSelectedClusterIdx] = useState<number | null>(0);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [expandedClusters, setExpandedClusters] = useState<Set<number>>(new Set([0]));

  // Индексируем калибровки и GPS точки из /parse по runId
  const calByRunId = useMemo(() => {
    const map = new Map<string, CalibrationRun>();
    for (const route of routes) {
      for (const seg of route.segments ?? []) {
        for (const cal of seg.calibrations ?? []) {
          map.set(cal.runId, cal);
        }
      }
    }
    return map;
  }, [routes]);

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
    return clusters.map((cluster, idx) => {
      const color = GROUP_COLORS[idx % GROUP_COLORS.length];
      const allPoints = cluster.flatMap(runId => pointsByRunId.get(runId) ?? []);
      return { idx, color, runIds: cluster, allPoints };
    });
  }, [clusters, pointsByRunId]);

  const visibleLayers = useMemo(() => {
    if (selectedClusterIdx === null) return groupLayers;
    const group = groupLayers.find(g => g.idx === selectedClusterIdx);
    if (!group) return [];
    if (selectedRunId) {
      const pts = pointsByRunId.get(selectedRunId) ?? [];
      return [{ ...group, allPoints: pts }];
    }
    return [group];
  }, [selectedClusterIdx, selectedRunId, groupLayers, pointsByRunId]);

  const center = useMemo((): [number, number] => {
    for (const layer of visibleLayers) {
      if (layer.allPoints.length > 0) return layer.allPoints[0];
    }
    for (const layer of groupLayers) {
      if (layer.allPoints.length > 0) return layer.allPoints[0];
    }
    return [56.9932, 40.9809];
  }, [visibleLayers, groupLayers]);

  const toggleCluster = (idx: number) => {
    const next = new Set(expandedClusters);
    next.has(idx) ? next.delete(idx) : next.add(idx);
    setExpandedClusters(next);
  };

  return (
    <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
      {/* Левая панель */}
      <div style={{ width: '300px', flexShrink: 0, border: '1px solid var(--border)', borderRadius: '4px', padding: '10px', maxHeight: '610px', overflowY: 'auto' }}>
        <button
          onClick={() => { setSelectedClusterIdx(null); setSelectedRunId(null); }}
          style={{ width: '100%', marginBottom: '8px', padding: '6px 10px', border: 'none', background: selectedClusterIdx === null ? '#333' : 'transparent', color: selectedClusterIdx === null ? 'white' : 'var(--text)', cursor: 'pointer', borderRadius: '3px', textAlign: 'left' }}
        >
          Все группы ({groupLayers.length})
        </button>
        {groupLayers.map(g => {
          const isExpanded = expandedClusters.has(g.idx);
          const isSelected = selectedClusterIdx === g.idx && !selectedRunId;
          return (
            <div key={g.idx} style={{ marginBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button onClick={() => toggleCluster(g.idx)}
                  style={{ width: '16px', height: '16px', border: '1px solid #999', background: 'transparent', cursor: 'pointer', fontSize: '10px', padding: 0, flexShrink: 0 }}>
                  {isExpanded ? '−' : '+'}
                </button>
                <button
                  onClick={() => { setSelectedClusterIdx(g.idx); setSelectedRunId(null); }}
                  style={{ flex: 1, padding: '5px 8px', border: 'none', background: isSelected ? g.color : 'transparent', color: isSelected ? 'white' : 'var(--text)', cursor: 'pointer', borderRadius: '3px', textAlign: 'left', fontSize: '13px', borderLeft: `3px solid ${g.color}` }}
                >
                  Группа #{g.idx + 1} · {g.runIds.length} калибр.
                </button>
              </div>
              {isExpanded && (
                <div style={{ marginLeft: '20px', marginTop: '2px' }}>
                  {g.runIds.map(runId => {
                    const cal = calByRunId.get(runId);
                    const isRunSelected = selectedClusterIdx === g.idx && selectedRunId === runId;
                    return (
                      <div key={runId}
                        onClick={() => { setSelectedClusterIdx(g.idx); setSelectedRunId(runId); }}
                        style={{ padding: '3px 6px', cursor: 'pointer', background: isRunSelected ? '#e3f2fd' : 'transparent', borderRadius: '3px', fontSize: '12px', marginBottom: '1px' }}>
                        📍 {cal ? new Date(cal.startedAtMillis).toLocaleDateString() : runId.slice(0, 8)}
                        {cal && ` — ${cal.source ?? 'N/A'}`}
                        {` (${(pointsByRunId.get(runId) ?? []).length} точек)`}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Карта */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '8px', fontSize: '14px' }}>
          {selectedClusterIdx === null ? 'Все группы' : `Группа #${selectedClusterIdx + 1}`}
          {selectedRunId && ` → ${new Date(calByRunId.get(selectedRunId)?.startedAtMillis ?? 0).toLocaleDateString()}`}
          {' — '}{visibleLayers.reduce((sum, g) => sum + g.allPoints.length, 0)} точек
        </div>
        <MapContainer center={center} zoom={13} style={{ height: '600px', width: '100%', borderRadius: '8px' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
          {visibleLayers.map(layer => (
            <React.Fragment key={layer.idx}>
              {layer.allPoints.length > 1 && (
                <Polyline positions={layer.allPoints} pathOptions={{ color: layer.color, weight: 2, opacity: 0.6 }} />
              )}
              {layer.allPoints.map((pt, i) => (
                <CircleMarker key={i} center={pt} radius={3} pathOptions={{ color: layer.color, fillOpacity: 0.6, weight: 1 }}>
                  <Tooltip>Группа #{layer.idx + 1}</Tooltip>
                </CircleMarker>
              ))}
            </React.Fragment>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default SimilarMap;
