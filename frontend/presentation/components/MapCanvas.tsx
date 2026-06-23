import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Polyline } from 'react-leaflet';
import type { CalibrationSnapshot } from '../../domain/types';

export interface MapPath {
  segmentId: string;
  color: string;
  points: [number, number][];
}

interface Props {
  center: [number, number];
  fingerprints: CalibrationSnapshot[];
  segmentColors: Record<string, string>;
  segmentPaths: MapPath[];
  breadcrumb: string;
  legend: { segmentId: string; name: string; color: string }[];
}

const MapCanvas: React.FC<Props> = ({ center, fingerprints, segmentColors, segmentPaths, breadcrumb, legend }) => (
  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
    <div style={{ marginBottom: '10px', fontSize: '14px' }}>
      <strong>{breadcrumb}</strong>
      {' — '}{fingerprints.length} точек GPS
    </div>
    <div style={{ display: 'flex', gap: '12px', marginBottom: '8px', fontSize: '13px' }}>
      {legend.map(item => (
        <div key={item.segmentId} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.color }} />
          {item.name}
        </div>
      ))}
    </div>
    <MapContainer center={center} zoom={14} style={{ height: '600px', width: '100%', borderRadius: '8px' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      {segmentPaths.map((path) => (
        <Polyline key={path.segmentId} positions={path.points} pathOptions={{ color: path.color, weight: 3, opacity: 0.8 }} />
      ))}
      {fingerprints.map((fp) => (
        <CircleMarker key={fp.snapshotId} center={[fp.gpsLatitude, fp.gpsLongitude]} radius={4}
          pathOptions={{ color: segmentColors[fp.segmentId] || '#999', fillOpacity: 0.7, weight: 1 }}>
          <Tooltip>
            Время: {new Date(fp.gpsTimestamp).toLocaleString()}
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  </div>
);

export default MapCanvas;
