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

interface TrainConfig {
  minRouteSimiliraty: number;
  minCosin: number;
  maxLengthDiffirence: number;
  epochs: number;
  learningRate: number;
}

const DEFAULT_TRAIN_CONFIG: TrainConfig = {
  minRouteSimiliraty: 0.7,
  minCosin: 0.7,
  maxLengthDiffirence: 0.3,
  epochs: 100,
  learningRate: 0.001,
};

function formatVersion(_version: string, index: number): string {
  return `#${index + 1}`;
}

function extractError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const axiosErr = err as { response?: { data?: { error?: unknown } } };
    const e = axiosErr.response?.data?.error;
    if (typeof e === 'string') return e;
    if (typeof e === 'object' && e !== null && 'message' in e) return String((e as { message: string }).message);
  }
  return 'Неизвестная ошибка';
}

const ModelsTab: React.FC = () => {
  const [models, setModels] = useState<ModelEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [trainConfig, setTrainConfig] = useState<TrainConfig>(DEFAULT_TRAIN_CONFIG);

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
    } catch (err: unknown) {
      showMsg(extractError(err), true);
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
      form.append('config', JSON.stringify(trainConfig));
      const { data } = await apiClient.post('/route/train', form);
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      showMsg(`Обучена версия ${parsed.version}, F1=${parsed.metrics?.f1}`);
      fetchModels();
    } catch (err: unknown) {
      showMsg(extractError(err), true);
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
        <h3 style={{ marginTop: 0 }}>Обучить модель на своей БД</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px', fontSize: '14px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span>Схожесть маршрутов (0..1)</span>
            <input type="number" step="0.05" min="0" max="1"
              value={trainConfig.minRouteSimiliraty}
              onChange={e => setTrainConfig(c => ({ ...c, minRouteSimiliraty: +e.target.value }))}
              style={{ padding: '6px', border: '1px solid var(--border)', borderRadius: '4px' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span>Косинусное сходство (0..1)</span>
            <input type="number" step="0.05" min="0" max="1"
              value={trainConfig.minCosin}
              onChange={e => setTrainConfig(c => ({ ...c, minCosin: +e.target.value }))}
              style={{ padding: '6px', border: '1px solid var(--border)', borderRadius: '4px' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span>Разница длин (0..1)</span>
            <input type="number" step="0.05" min="0" max="1"
              value={trainConfig.maxLengthDiffirence}
              onChange={e => setTrainConfig(c => ({ ...c, maxLengthDiffirence: +e.target.value }))}
              style={{ padding: '6px', border: '1px solid var(--border)', borderRadius: '4px' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span>Эпохи</span>
            <input type="number" step="10" min="10" max="500"
              value={trainConfig.epochs}
              onChange={e => setTrainConfig(c => ({ ...c, epochs: +e.target.value }))}
              style={{ padding: '6px', border: '1px solid var(--border)', borderRadius: '4px' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span>Learning Rate</span>
            <input type="number" step="0.001" min="0.001" max="1"
              value={trainConfig.learningRate}
              onChange={e => setTrainConfig(c => ({ ...c, learningRate: +e.target.value }))}
              style={{ padding: '6px', border: '1px solid var(--border)', borderRadius: '4px' }} />
          </label>
        </div>
        <DropZone accept={['.db', '.sqlite']} disabled={loading} hint="(.db, .sqlite) — модель обучится и сохранится автоматически" onFile={handleTrain} />
      </div>

      <div style={{ border: '1px solid var(--border)', borderRadius: '6px', padding: '16px', marginBottom: '24px' }}>
        <h3 style={{ marginTop: 0 }}>Загрузить модель (JSON)</h3>
        <DropZone accept={['.json']} disabled={loading} hint="(.json)" onFile={handleUpload} />
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
          {models.map((m, idx) => (
            <tr key={m.id}>
              <td style={{ border: '1px solid var(--border)', padding: '8px' }}>{m.name}</td>
              <td style={{ border: '1px solid var(--border)', padding: '8px' }}>{m.description}</td>
              <td style={{ border: '1px solid var(--border)', padding: '8px', fontFamily: 'monospace' }}>{formatVersion(m.version, idx)}</td>
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
