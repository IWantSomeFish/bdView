import React from 'react';
import type { ModelType } from '../../domain/types';

interface Props {
  value: ModelType;
  onChange: (type: ModelType) => void;
}

const OPTIONS: { type: ModelType; label: string; description: string }[] = [
  { type: 'route_similarity', label: 'Сравнение маршрутов', description: 'Проверяет, похожи ли два маршрута' },
  { type: 'wifi_filter', label: 'Фильтрация Wi-Fi', description: 'Определяет стабильность Wi-Fi сети' },
];

const ModelTypeSelector: React.FC<Props> = ({ value, onChange }) => (
  <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
    {OPTIONS.map(opt => (
      <button
        key={opt.type}
        onClick={() => onChange(opt.type)}
        style={{
          flex: 1, padding: '12px', border: '2px solid',
          borderColor: value === opt.type ? '#007bff' : 'var(--border)',
          borderRadius: '6px', cursor: 'pointer',
          background: value === opt.type ? '#007bff' : 'transparent',
          color: value === opt.type ? 'white' : 'var(--text)',
          textAlign: 'left',
        }}
      >
        <div style={{ fontWeight: value === opt.type ? 'bold' : 'normal', marginBottom: '4px' }}>
          {opt.label}
        </div>
        <div style={{ fontSize: '12px', opacity: 0.8 }}>{opt.description}</div>
      </button>
    ))}
  </div>
);

export default ModelTypeSelector;
