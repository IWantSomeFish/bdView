import React, { useState, useEffect } from 'react';
import { apiClient } from '../../infrastructure/http/apiClient';
import DropZone from './DropZone';

interface ModelEntry {
  id: string;
  name: string;
  description: string;
  version: string;
  uploadedAt: string;
  status: 'ok' | 'failed';
}

const ModelsTab: React.FC = () => {
  const [models, setModels] = useState<ModelEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const fetchModels = async () => {
    try {
      const { data } = await apiClient.get<ModelEntry[]>('/models');
      setModels(data);
    } catch {
      // бэкенд ещё не реализовал эндпоинт
    }
  };

  useEffect(() => { fetchModels(); }, []);

  const showMsg = (text: string, error = false) => { setMessage(text); setIsError(error); };

  const handleUpload = async (file: File) => {
    setLoading(true);
    setMessage(null);
    try {
      const form = new FormData();
      form.append('model', file);
      const { data } = await apiClient.post('/models/upload', form);
      showMsg(`Загружена версия ${data.version}`);
      fetchModels();
    } catch (err: any) {
      showMsg(err.response?.data?.error ?? 'Ошибка загрузки модели', true);
    } finally {
      setLoading(false);
    }
  };

  const handleTrain = async (file: File) => {
    setLoading(true);
    setMessage(null);
    try {
      const form = new FormData();
      form.append('database', file);
      const { data } = await apiClient.post('/train', form);
      showMsg(`Обучена версия ${data.version}, F1=${data.metrics?.f1}`);
      fetchModels();
    } catch (err: any) {
      showMsg(err.response?.data?.error ?? 'Ошибка обучения модели', true);
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      <h2 style={{ marginTop: 0 }}>Модели нейросети</h2>

      {message && (
        <div style={{ padding: '10px', marginBottom: '16px', borderRadius: '6px', background: isError ? '#e74c3c' : '#27ae60', color: 'white' }}>
          {message}
        </div>
      )}

      <div style={{ border: '1px solid var(--border)', borderRadius: '6px', padding: '16px', marginBottom: '16px' }}>
        <h3 style={{ marginTop: 0 }}>Загрузить модель (JSON)</h3>
        <DropZone accept={['.json']} disabled={loading} hint="(.json)" onFile={handleUpload} />
      </div>

      <div style={{ border: '1px solid var(--border)', borderRadius: '6px', padding: '16px', marginBottom: '24px' }}>
        <h3 style={{ marginTop: 0 }}>Обучить модель на своей БД</h3>
        <DropZone accept={['.db', '.sqlite']} disabled={loading} hint="(.db, .sqlite) — модель обучится и сохранится автоматически" onFile={handleTrain} />
      </div>

      <h3>Список моделей</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
        <thead>
          <tr>
            {['Название', 'Описание', 'Версия', 'Дата', 'Статус'].map(col => (
              <th key={col} style={{ border: '1px solid var(--border)', padding: '8px', background: 'var(--bg)', textAlign: 'left' }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {models.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: '12px', color: '#999', textAlign: 'center' }}>
                Нет загруженных моделей
              </td>
            </tr>
          )}
          {models.map(m => (
            <tr key={m.id}>
              <td style={{ border: '1px solid var(--border)', padding: '8px' }}>{m.name}</td>
              <td style={{ border: '1px solid var(--border)', padding: '8px' }}>{m.description}</td>
              <td style={{ border: '1px solid var(--border)', padding: '8px', fontFamily: 'monospace' }}>{m.version}</td>
              <td style={{ border: '1px solid var(--border)', padding: '8px' }}>{m.uploadedAt}</td>
              <td style={{ border: '1px solid var(--border)', padding: '8px' }}>
                <span style={{ color: m.status === 'ok' ? '#27ae60' : '#e74c3c', fontWeight: 'bold' }}>
                  {m.status === 'ok' ? '✓ Активна' : '✗ Ошибка'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

export default ModelsTab;
