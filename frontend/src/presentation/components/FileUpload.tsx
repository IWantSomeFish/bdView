import React, { useState } from 'react';
import { useDatabase } from '../hooks/useDatabase';
import DatabaseTab from './DatabaseTab';
import ModelsTab from './ModelsTab';

type Tab = 'database' | 'models';

const TABS: { id: Tab; label: string }[] = [
  { id: 'database', label: 'База данных' },
  { id: 'models', label: 'Модели нейросети' },
];

const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: '8px 20px', border: 'none',
  borderBottom: active ? '2px solid #007bff' : '2px solid transparent',
  background: 'transparent', cursor: 'pointer',
  fontWeight: active ? 'bold' : 'normal',
  color: active ? '#007bff' : 'var(--text)', fontSize: '15px',
});

const FileUpload: React.FC = () => {
  const [tab, setTab] = useState<Tab>('database');
  const [file, setFile] = useState<File | null>(null);
  const { backendOnline, uploading, result, similarResult, error, upload, similar, reset } = useDatabase();

  const pickFile = (f: File) => { setFile(f); reset(); };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '20px' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={tabStyle(tab === t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'database' && (
        <DatabaseTab
          backendOnline={backendOnline}
          uploading={uploading}
          result={result}
          similarResult={similarResult}
          error={error}
          onPickFile={pickFile}
          onUpload={() => file && upload(file)}
          onSimilar={(modelFile) => file && similar(file, modelFile)}
        />
      )}

      {tab === 'models' && <ModelsTab />}
    </div>
  );
};

export default FileUpload;
