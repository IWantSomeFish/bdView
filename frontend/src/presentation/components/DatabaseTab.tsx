import React, { useRef } from 'react';
import RouteMap from './RouteMap';
import SimilarMap from './SimilarMap';
import ErrorMessage from './ErrorMessage';
import type { ParseResult, SimilarResult } from '../../domain/types';

const ACCEPT = ['.sqlite', '.db'];
const isValidFile = (f: File) => ACCEPT.some(ext => f.name.endsWith(ext));

interface Props {
  file: File | null;
  dragging: boolean;
  backendOnline: boolean | null;
  uploading: boolean;
  result: ParseResult | null;
  similarResult: SimilarResult | null;
  error: string | null;
  onPickFile: (f: File) => void;
  onDraggingChange: (v: boolean) => void;
  onUpload: () => void;
  onSimilar: () => void;
}

const DatabaseTab: React.FC<Props> = ({
  file, dragging, backendOnline, uploading, result, similarResult, error,
  onPickFile, onDraggingChange, onUpload, onSimilar,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const disabled = !file || uploading || !backendOnline;

  const btnStyle = (color: string, dis = disabled): React.CSSProperties => ({
    padding: '10px 20px',
    backgroundColor: dis ? '#ccc' : color,
    color: 'white', border: 'none', borderRadius: '4px',
    cursor: dis ? 'not-allowed' : 'pointer',
  });

  return (
    <>
      <h2 style={{ marginTop: 0 }}>Загрузка SQLite базы данных</h2>

      {backendOnline === false && <ErrorMessage message="Backend недоступен. Загрузка файла невозможна." />}

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); onDraggingChange(true); }}
        onDragLeave={() => onDraggingChange(false)}
        onDrop={(e) => {
          e.preventDefault();
          onDraggingChange(false);
          const f = e.dataTransfer.files[0];
          if (f && isValidFile(f)) onPickFile(f);
        }}
        style={{
          marginBottom: '15px', padding: '30px',
          border: `2px dashed ${dragging ? '#007bff' : '#aaa'}`,
          borderRadius: '8px', backgroundColor: dragging ? '#e8f0fe' : 'var(--bg)',
          textAlign: 'center', cursor: (uploading || !backendOnline) ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s', userSelect: 'none',
        }}
      >
        {file
          ? <><strong>{file.name}</strong><br /><span style={{ fontSize: '13px', color: '#555' }}>{(file.size / (1024 * 1024)).toFixed(2)} MB</span></>
          : <span style={{ color: '#666' }}>Перетащите файл сюда или нажмите для выбора<br /><small>(.sqlite, .db)</small></span>
        }
        <input ref={inputRef} type="file" accept={ACCEPT.join(',')}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onPickFile(f); }}
          disabled={uploading || !backendOnline} style={{ display: 'none' }} />
      </div>

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
