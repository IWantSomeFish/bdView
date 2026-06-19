import React from 'react';
import RouteMap from './RouteMap';
import SimilarMap from './SimilarMap';
import ErrorMessage from './ErrorMessage';
import DropZone from './DropZone';
import type { ParseResult, SimilarResult } from '../../domain/types';

interface Props {
  file: File | null;
  backendOnline: boolean | null;
  uploading: boolean;
  result: ParseResult | null;
  similarResult: SimilarResult | null;
  error: string | null;
  onPickFile: (f: File) => void;
  onUpload: () => void;
  onSimilar: () => void;
}

const DatabaseTab: React.FC<Props> = ({
  backendOnline, uploading, result, similarResult, error,
  onPickFile, onUpload, onSimilar,
}) => {
  const disabled = uploading || !backendOnline;

  const btnStyle = (color: string): React.CSSProperties => ({
    padding: '10px 20px',
    backgroundColor: disabled ? '#ccc' : color,
    color: 'white', border: 'none', borderRadius: '4px',
    cursor: disabled ? 'not-allowed' : 'pointer',
  });

  return (
    <>
      <h2 style={{ marginTop: 0 }}>Загрузка SQLite базы данных</h2>

      {backendOnline === false && <ErrorMessage message="Backend недоступен. Загрузка файла невозможна." />}

      <DropZone
        accept={['.sqlite', '.db']}
        disabled={disabled}
        hint="(.sqlite, .db)"
        onFile={onPickFile}
      />

      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <button onClick={onUpload} disabled={disabled} style={btnStyle('#007bff')}>
          {uploading ? 'Загрузка...' : 'Загрузить базу данных'}
        </button>
        <button onClick={onSimilar} disabled={disabled} style={btnStyle('#8e44ad')}>
          {uploading ? 'Анализ...' : 'Анализ похожих'}
        </button>
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
