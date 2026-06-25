import React, { useState } from 'react';
import RouteMap from './RouteMap';
import SimilarMap from './SimilarMap';
import ErrorMessage from './ErrorMessage';
import DropZone from './DropZone';
import type { ParseResult, SimilarResult } from '../../domain/types';

interface Props {
  backendOnline: boolean | null;
  uploading: boolean;
  result: ParseResult | null;
  similarResult: SimilarResult | null;
  error: string | null;
  onPickFile: (f: File) => void;
  onUpload: () => void;
  onSimilar: (modelFile: File) => void;
}

const DatabaseTab: React.FC<Props> = ({
  backendOnline, uploading, result, similarResult, error,
  onPickFile, onUpload, onSimilar,
}) => {
  const [modelFile, setModelFile] = useState<File | null>(null);
  const disabled = uploading || !backendOnline;

  const cardStyle: React.CSSProperties = {
    border: '1px solid var(--border)', borderRadius: '6px', padding: '16px',
    flex: 1, minWidth: '280px',
  };

  const btn = (color: string, dis = disabled): React.CSSProperties => ({
    padding: '10px 20px', backgroundColor: dis ? '#ccc' : color,
    color: 'white', border: 'none', borderRadius: '4px', cursor: dis ? 'not-allowed' : 'pointer',
    width: '100%', marginTop: '10px',
  });

  return (
    <>
      <h2 style={{ marginTop: 0 }}>Работа с базой данных</h2>

      {backendOnline === false && <ErrorMessage message="Backend недоступен. Загрузка файла невозможна." />}

      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0, marginBottom: '8px' }}>Загрузка базы</h3>
          <DropZone accept={['.sqlite', '.db']} disabled={disabled} hint="(.sqlite, .db)" onFile={onPickFile} />
          <button onClick={onUpload} disabled={disabled} style={btn('#007bff')}>
            {uploading ? 'Загрузка...' : 'Показать маршруты'}
          </button>
        </div>

        <div style={cardStyle}>
          <h3 style={{ marginTop: 0, marginBottom: '8px' }}>Анализ похожих</h3>
          <DropZone accept={['.json']} disabled={disabled} hint="Модель (.json)" onFile={setModelFile} />
          <button
            onClick={() => modelFile && onSimilar(modelFile)}
            disabled={disabled || !modelFile}
            style={btn('#8e44ad', disabled || !modelFile)}
          >
            {uploading ? 'Анализ...' : 'Запустить анализ'}
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
          <h4 style={{ color: '#8e44ad' }}>✓ Найдено {Object.values(similarResult).filter(v => v.length > 0).length} групп похожих маршрутов</h4>
          <SimilarMap routes={result} groups={similarResult} />
        </div>
      )}
    </>
  );
};

export default DatabaseTab;
