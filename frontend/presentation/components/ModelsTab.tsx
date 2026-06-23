import React, { useState, useEffect } from 'react';
import { apiClient } from '../../infrastructure/http/apiClient';
import DropZone from './DropZone';
import type { ModelEntry } from '../../domain/types';

const ModelsTab: React.FC = () => {
  const [models, setModels] = useState<ModelEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const fetchModels = async () => {
    try {
      const { data } = await apiClient.get<ModelEntry[]>('/models');
      setModels(data);
    } catch {}
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
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      showMsg(error.response?.data?.error ?? 'Ошибка загрузки модели', true);
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
      const { data } = await apiClient.post('/models/train', form);
      showMsg(`Обучена версия ${data.version}, F1=${data.metrics?.f1}`);
      fetchModels();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      showMsg(error.response?.data?.error ?? 'Ошибка обучения модели', true);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (model: ModelEntry) => {
    setLoading(true);
    setMessage(null);
    try {
      const { data } = await apiClient.get(`/models/${model.filename}`);
      const form = new FormData();
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      form.append('model', blob, model.filename);
      const resp = await apiClient.post('/models/upload', form);
      showMsg(`Версия ${resp.data.version} теперь активна`);
      fetchModels();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      showMsg(error.response?.data?.error ?? 'Ошибка активации', true);
    } finally {
      setLoading(false);
    }
  };

  const routeModels = models.filter(m => !m.description?.includes('wifi') && !m.description?.includes('Wi-Fi'));
  const wifiModels = models.filter(m => m.description?.includes('wifi') || m.description?.includes('Wi-Fi'));

  const renderTable = (items: ModelEntry[], title: string) => (
    <>
      <h3 style={{ marginTop: '20px' }}>{title}</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
        <thead>
          <tr>
            {['Название', 'Версия', 'Метрики', 'Дата', 'Статус', 'Действия'].map(col => (
              <th key={col} style={{ border: '1px solid var(--border)', padding: '8px', background: 'var(--bg)', textAlign: 'left' }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr>
              <td colSpan={6} style={{ padding: '12px', color: '#999', textAlign: 'center' }}>
                Нет загруженных моделей
              </td>
            </tr>
          )}
          {items.map(m => (
            <tr key={m.id} style={m.active ? { background: '#e8f5e9' } : {}}>
              <td style={{ border: '1px solid var(--border)', padding: '8px' }}>{m.name}</td>
              <td style={{ border: '1px solid var(--border)', padding: '8px', fontFamily: 'monospace' }}>{m.version}</td>
              <td style={{ border: '1px solid var(--border)', padding: '8px', fontFamily: 'monospace' }}>
                {m.metrics ? `F1=${m.metrics.f1} AUC=${m.metrics.auc}` : '—'}
              </td>
              <td style={{ border: '1px solid var(--border)', padding: '8px' }}>{m.uploadedAt}</td>
              <td style={{ border: '1px solid var(--border)', padding: '8px' }}>
                <span style={{ color: m.active ? '#27ae60' : '#999', fontWeight: 'bold' }}>
                  {m.active ? '✓ Активна' : '○ Архив'}
                </span>
              </td>
              <td style={{ border: '1px solid var(--border)', padding: '8px' }}>
                {!m.active && (
                  <button
                    onClick={() => handleActivate(m)}
                    disabled={loading}
                    style={{
                      padding: '4px 12px', backgroundColor: loading ? '#ccc' : '#007bff',
                      color: 'white', border: 'none', borderRadius: '3px',
                      cursor: loading ? 'not-allowed' : 'pointer', fontSize: '12px',
                    }}
                  >
                    Загрузить
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );

  return (
    <>
      <h2 style={{ marginTop: 0 }}>Модели нейросети</h2>

      {message && (
        <div style={{ padding: '10px', marginBottom: '16px', borderRadius: '6px', background: isError ? '#e74c3c' : '#27ae60', color: 'white' }}>
          {message}
        </div>
      )}

      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '300px', border: '1px solid var(--border)', borderRadius: '6px', padding: '16px' }}>
          <h3 style={{ marginTop: 0 }}>Загрузить модель (JSON)</h3>
          <DropZone accept={['.json']} disabled={loading} hint="(.json)" onFile={handleUpload} />
        </div>

        <div style={{ flex: 1, minWidth: '300px', border: '1px solid var(--border)', borderRadius: '6px', padding: '16px' }}>
          <h3 style={{ marginTop: 0 }}>Обучить модель на своей БД</h3>
          <DropZone accept={['.db', '.sqlite']} disabled={loading} hint="(.db, .sqlite) — модель обучится и сохранится автоматически" onFile={handleTrain} />
        </div>
      </div>

      {renderTable(routeModels, 'Модели схожести маршрутов')}
      {renderTable(wifiModels, 'Wi-Fi фильтрация')}
    </>
  );
};

export default ModelsTab;
