import React, { useState } from 'react';
import { useDatabase } from '../../usecases/useDatabase';

const FileUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const { backendOnline, uploading, result, error, upload } = useDatabase();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) setFile(files[0]);
  };

  const handleUpload = () => {
    if (file) upload(file);
  };

  const disabled = !file || uploading || !backendOnline;

  return (
    <div style={{ padding: '20px', maxWidth: '400px' }}>
      <h2>Загрузка SQLite базы данных</h2>

      {backendOnline === false && (
        <div style={{ color: 'red', marginBottom: '15px' }}>
          ⚠ Backend недоступен. Загрузка файла невозможна.
        </div>
      )}

      <div style={{ marginBottom: '15px' }}>
        <input
          type="file"
          accept=".sqlite,.db"
          onChange={handleFileChange}
          disabled={uploading || !backendOnline}
        />
      </div>

      {file && (
        <div style={{ marginBottom: '15px', fontSize: '14px' }}>
          Выбран файл: <strong>{file.name}</strong>
          <br />
          Размер: {(file.size / (1024 * 1024)).toFixed(2)} MB
        </div>
      )}

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

      {error && (
        <div style={{ color: 'red', marginTop: '15px' }}>Ошибка: {error}</div>
      )}

      {result && (
        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#e9f7ef', border: '1px solid #27ae60', borderRadius: '4px' }}>
          <h4>Успешно!</h4>
          <pre style={{ fontSize: '12px', overflow: 'auto' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
