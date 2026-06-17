import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDatabase } from '../hooks/useDatabase';
import RouteMap from './RouteMap';
import ErrorMessage from './ErrorMessage';

const ACCEPT = ['.sqlite', '.db'];
const isValidFile = (f: File) => ACCEPT.some(ext => f.name.endsWith(ext));

const FileUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const { backendOnline, uploading, result, similarResult, error, upload, similar, reset } = useDatabase();
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const pickFile = (f: File) => { setFile(f); reset(); };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) pickFile(files[0]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && isValidFile(f)) pickFile(f);
  };

  const disabled = !file || uploading || !backendOnline;

  const btnStyle = (color: string): React.CSSProperties => ({
    padding: '10px 20px',
    backgroundColor: disabled ? '#ccc' : color,
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: disabled ? 'not-allowed' : 'pointer',
  });

  return (
    <div style={{ padding: '20px' }}>
      <h2>Загрузка SQLite базы данных</h2>

      {backendOnline === false && (
        <ErrorMessage message="Backend недоступен. Загрузка файла невозможна." />
      )}

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{
          marginBottom: '15px',
          padding: '30px',
          border: `2px dashed ${dragging ? '#007bff' : '#aaa'}`,
          borderRadius: '8px',
          backgroundColor: dragging ? '#e8f0fe' : 'var(--bg)',
          textAlign: 'center',
          cursor: (uploading || !backendOnline) ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s',
          userSelect: 'none',
        }}
      >
        {file
          ? <><strong>{file.name}</strong><br /><span style={{ fontSize: '13px', color: '#555' }}>{(file.size / (1024 * 1024)).toFixed(2)} MB</span></>
          : <span style={{ color: '#666' }}>Перетащите файл сюда или нажмите для выбора<br /><small>(.sqlite, .db)</small></span>
        }
        <input ref={inputRef} type="file" accept={ACCEPT.join(',')} onChange={handleFileChange}
          disabled={uploading || !backendOnline} style={{ display: 'none' }} />
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <button onClick={() => file && upload(file)} disabled={disabled} style={btnStyle('#007bff')}>
          {uploading ? 'Загрузка...' : 'Загрузить базу данных'}
        </button>
        <button onClick={() => file && similar(file)} disabled={disabled} style={btnStyle('#8e44ad')}>
          {uploading ? 'Анализ...' : 'Анализ похожих'}
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* /parse — карта прямо здесь */}
      {result && (
        <div style={{ marginTop: '15px' }}>
          <h4 style={{ color: '#27ae60' }}>✓ База данных загружена ({result.length} маршрутов)</h4>
          <RouteMap routes={result} />
        </div>
      )}

      {/* /similar — переход на отдельную страницу */}
      {similarResult && (
        <div style={{ marginTop: '15px' }}>
          <h4 style={{ color: '#8e44ad' }}>✓ Найдено {similarResult.length} групп похожих маршрутов</h4>
          <button
            onClick={() => navigate('/routes', { state: { similarResult } })}
            style={{ padding: '10px 20px', backgroundColor: '#8e44ad', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Просмотреть группы →
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
