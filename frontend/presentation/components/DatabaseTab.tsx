import React, { useState, useEffect } from 'react';
import RouteMap from './RouteMap';
import SimilarMap from './SimilarMap';
import ErrorMessage from './ErrorMessage';
import DropZone from './DropZone';
import { apiClient } from '../../infrastructure/http/apiClient';
import type { ParseResult, SimilarResult, ModelEntry } from '../../domain/types';

interface Props {
  backendOnline: boolean | null;
  uploading: boolean;
  result: ParseResult | null;
  similarResult: SimilarResult | null;
  error: string | null;
  onPickFile: (f: File) => void;
  onUpload: () => void;
  onSimilar: (modelId?: string) => void;
}

const DatabaseTab: React.FC<Props> = ({
  backendOnline, uploading, result, similarResult, error,
  onPickFile, onUpload, onSimilar,
}) => {
  const [models, setModels] = useState<ModelEntry[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const disabled = uploading || !backendOnline;

  useEffect(() => {
    apiClient.get<ModelEntry[]>('/models')
      .then(({ data }) => {
        const routeModels = data.filter(m => !m.description?.includes('wifi') && !m.description?.includes('Wi-Fi'));
        setModels(routeModels);
        const active = routeModels.find(m => m.active);
        if (active) setSelectedModelId(active.filename);
      })
      .catch(() => {});
  }, []);

  const btn = (color: string, dis = disabled): React.CSSProperties => ({
    padding: '10px 20px', backgroundColor: dis ? '#ccc' : color,
    color: 'white', border: 'none', borderRadius: '4px', cursor: dis ? 'not-allowed' : 'pointer',
  });

  return (
    <>
      <h2 style={{ marginTop: 0 }}>Загрузка SQLite базы данных</h2>

      {backendOnline === false && <ErrorMessage message="Backend недоступен. Загрузка файла невозможна." />}

      <DropZone accept={['.sqlite', '.db']} disabled={disabled} hint="(.sqlite, .db)" onFile={onPickFile} />

      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <button onClick={onUpload} disabled={disabled} style={btn('#007bff')}>
          {uploading ? 'Загрузка...' : 'Загрузить базу данных'}
        </button>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            value={selectedModelId}
            onChange={e => setSelectedModelId(e.target.value)}
            disabled={disabled || models.length === 0}
            style={{
              padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc',
              fontSize: '14px', minWidth: '200px',
            }}
          >
            {models.length === 0 && <option value="">Нет моделей</option>}
            {models.map(m => (
              <option key={m.filename} value={m.filename}>
                {m.version} {m.active ? '(активна)' : ''} {m.metrics ? `F1=${m.metrics.f1}` : ''}
              </option>
            ))}
          </select>
          <button
            onClick={() => onSimilar(selectedModelId || undefined)}
            disabled={disabled || models.length === 0}
            style={btn('#8e44ad', disabled || models.length === 0)}
          >
            {uploading ? 'Анализ...' : 'Анализ похожих'}
          </button>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {result && !similarResult && (
        <div style={{ marginTop: '15px' }}>
          <h4 style={{ color: '#27ae60' }}>✓ База данных загружена ({result.length} маршрутов)</h4>
          <RouteMap routes={result} />
        </div>
      )}

      {result && similarResult && (
        <div style={{ marginTop: '15px' }}>
          <h4 style={{ color: '#8e44ad' }}>✓ Найдено {similarResult.length} групп похожих маршрутов</h4>
          <SimilarMap routes={result} groups={similarResult} />
        </div>
      )}
    </>
  );
};

export default DatabaseTab;
