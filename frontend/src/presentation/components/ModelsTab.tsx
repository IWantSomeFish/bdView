import React, { useState } from 'react';

interface ModelEntry {
  id: string;
  name: string;
  description: string;
  version: string;
  uploadedAt: string;
  status: 'ok' | 'failed';
}

const MOCK_MODELS: ModelEntry[] = [
  { id: '1', name: 'route-encoder-v1.json', description: 'Группировка маршрутов', version: '1.0.0', uploadedAt: '2026-06-10', status: 'ok' },
];

const ModelsTab: React.FC = () => {
  const [modelFile, setModelFile] = useState<File | null>(null);

  const btnStyle = (dis: boolean): React.CSSProperties => ({
    padding: '10px 20px',
    backgroundColor: dis ? '#ccc' : '#007bff',
    color: 'white', border: 'none', borderRadius: '4px',
    cursor: dis ? 'not-allowed' : 'pointer',
    whiteSpace: 'nowrap',
  });

  return (
    <>
      <h2 style={{ marginTop: 0 }}>Модели нейросети</h2>

      <div style={{ border: '1px solid var(--border)', borderRadius: '6px', padding: '16px', marginBottom: '24px' }}>
        <h3 style={{ marginTop: 0 }}>Загрузить модель</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input type="file" onChange={(e) => setModelFile(e.target.files?.[0] ?? null)} />
          <button disabled={!modelFile} onClick={() => {/* TODO: API */}} style={btnStyle(!modelFile)}>
            Загрузить
          </button>
        </div>
      </div>

      <h3>Список моделей</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
        <thead>
          <tr>
            {['Название', 'Описание', 'Версия', 'Дата загрузки', 'Статус', ''].map(col => (
              <th key={col} style={{ border: '1px solid var(--border)', padding: '8px', background: 'var(--bg)', textAlign: 'left' }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MOCK_MODELS.map(m => (
            <tr key={m.id}>
              <td style={{ border: '1px solid var(--border)', padding: '8px' }}>{m.name}</td>
              <td style={{ border: '1px solid var(--border)', padding: '8px' }}>{m.description}</td>
              <td style={{ border: '1px solid var(--border)', padding: '8px' }}>{m.version}</td>
              <td style={{ border: '1px solid var(--border)', padding: '8px' }}>{m.uploadedAt}</td>
              <td style={{ border: '1px solid var(--border)', padding: '8px' }}>
                <span style={{ color: m.status === 'ok' ? '#27ae60' : '#e74c3c', fontWeight: 'bold' }}>
                  {m.status === 'ok' ? '✓ Активна' : '✗ Неудачная'}
                </span>
              </td>
              <td style={{ border: '1px solid var(--border)', padding: '8px' }}>
                <button
                  onClick={() => {/* TODO: API тренировки */}}
                  style={{ padding: '4px 12px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                >
                  Тренировать
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

export default ModelsTab;
