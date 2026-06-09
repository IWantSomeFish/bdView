<<<<<<< HEAD
import React, { useState, useRef } from 'react';
import { useDatabase } from '../hooks/useDatabase';
import PaginatedTable from './PaginatedTable';
import ErrorMessage from './ErrorMessage';

const ACCEPT = ['.sqlite', '.db'];

const isValidFile = (f: File) => ACCEPT.some(ext => f.name.endsWith(ext));
||||||| 0eccf4e
import React, { useState } from 'react';
import { useDatabase } from '../../usecases/useDatabase';
=======
import React, { useState, useRef } from 'react';
import { useDatabase } from '../../usecases/useDatabase';
import PaginatedTable from './PaginatedTable';

const ACCEPT = ['.sqlite', '.db'];
>>>>>>> master

const FileUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const { backendOnline, uploading, result, error, upload, reset } = useDatabase();
  const inputRef = useRef<HTMLInputElement>(null);

  const pickFile = (f: File) => { setFile(f); reset(); };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
<<<<<<< HEAD
    if (files && files.length > 0) pickFile(files[0]);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragging(false);
    const f = event.dataTransfer.files[0];
    if (f && isValidFile(f)) pickFile(f);
||||||| 0eccf4e
    if (files && files.length > 0) setFile(files[0]);
=======
    if (files && files.length > 0) pickFile(files[0]);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragging(false);
    const f = event.dataTransfer.files[0];
    if (f) pickFile(f);
>>>>>>> master
  };

  const handleUpload = () => {
    if (file) upload(file);
  };

  const disabled = !file || uploading || !backendOnline;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Загрузка SQLite базы данных</h2>

      {backendOnline === false && (
        <ErrorMessage message="Backend недоступен. Загрузка файла невозможна." />
      )}

<<<<<<< HEAD
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
||||||| 0eccf4e
      <div style={{ marginBottom: '15px' }}>
=======
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
          backgroundColor: dragging ? '#e8f0fe' : '#16171d',
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
>>>>>>> master
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT.join(',')}
          onChange={handleFileChange}
          disabled={uploading || !backendOnline}
          style={{ display: 'none' }}
        />
      </div>

      <button
        onClick={handleUpload}
        disabled={disabled}
        style={{
          padding: '10px 20px',
          backgroundColor: disabled ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        {uploading ? 'Загрузка...' : 'Загрузить базу данных'}
      </button>

      {error && <ErrorMessage message={error} />}

      {result && (
        <div style={{ marginTop: '15px' }}>
          <h4 style={{ color: '#27ae60' }}>✓ База данных загружена</h4>
          {Object.entries(result).map(([tableName, rows]) => (
            <PaginatedTable key={tableName} name={tableName} rows={rows as Record<string, unknown>[]} />
          ))}
        </div>
      )}
    </div>
    );
};

    export default FileUpload;
