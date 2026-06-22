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
  // groups = { runId: [similarRunId, ...], ... }
  // Строим кластеры: объединяем runId-ы которые похожи друг на друга
  const clusters = useMemo(() => {
    const entries = Object.entries(groups);
    const visited = new Set<string>();
    const result: string[][] = [];

    for (const [runId, similarIds] of entries) {
      if (visited.has(runId)) continue;
      const cluster = [runId, ...similarIds.filter(id => !visited.has(id))];
      cluster.forEach(id => visited.add(id));
      if (cluster.length > 0) result.push(cluster);
    }
    return result;
  }, [groups]);

  const [selectedClusterIdx, setSelectedClusterIdx] = useState<number | null>(0);

  // Индексируем GPS точки из /parse по runId
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

  const visibleLayers = selectedClusterIdx === null ? groupLayers : groupLayers.filter(g => g.idx === selectedClusterIdx);

  const center = useMemo((): [number, number] => {
    for (const layer of groupLayers) {
      if (layer.allPoints.length > 0) return layer.allPoints[0];
    }
    return [56.9932, 40.9809];
  }, [groupLayers]);

  return (
    <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
      {/* Левая панель */}
      <div style={{ width: '300px', flexShrink: 0, border: '1px solid var(--border)', borderRadius: '4px', padding: '10px', maxHeight: '610px', overflowY: 'auto' }}>
        <button
          onClick={() => setSelectedClusterIdx(null)}
          style={{ width: '100%', marginBottom: '8px', padding: '6px 10px', border: 'none', background: selectedClusterIdx === null ? '#333' : 'transparent', color: selectedClusterIdx === null ? 'white' : 'var(--text)', cursor: 'pointer', borderRadius: '3px', textAlign: 'left' }}
        >
          Все группы
        </button>
        {groupLayers.map(g => (
          <button key={g.idx}
            onClick={() => setSelectedClusterIdx(g.idx)}
            style={{ width: '100%', marginBottom: '4px', padding: '6px 10px', border: 'none', background: selectedClusterIdx === g.idx ? g.color : 'transparent', color: selectedClusterIdx === g.idx ? 'white' : 'var(--text)', cursor: 'pointer', borderRadius: '3px', textAlign: 'left', borderLeft: `4px solid ${g.color}` }}
          >
            Группа #{g.idx + 1} · {g.runIds.length} калибр. · {g.allPoints.length} точек
          </button>
        ))}
      </div>

      {/* Карта */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '8px', fontSize: '14px' }}>
          {selectedClusterIdx === null ? 'Все группы' : `Группа #${selectedClusterIdx + 1}`}
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
