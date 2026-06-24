import React, { useState } from 'react';
import type { ModelType, InferenceRequest, InferenceResult } from '../../domain/types';
import { databaseRepository } from '../../infrastructure/repositories/DatabaseRepository';
import { runInference } from '../../usecases/inference';
import ModelTypeSelector from './ModelTypeSelector';
import InferenceResultView from './InferenceResult';
import DropZone from './DropZone';

const InferencePanel: React.FC = () => {
  const [modelType, setModelType] = useState<ModelType>('route_similarity');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InferenceResult | null>(null);

  const [dbFile, setDbFile] = useState<File | null>(null);
  const [modelFile, setModelFile] = useState<File | null>(null);

  const handleRun = async () => {
    if (!dbFile || !modelFile) {
      setError('Загрузите файл базы данных и модель');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const request: InferenceRequest = { modelType, dbFile, modelFile };
      const res = await runInference(databaseRepository, request);
      setResult(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка инференса';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || !dbFile || !modelFile;

  return (
    <div>
      <ModelTypeSelector value={modelType} onChange={setModelType} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 'bold' }}>
            База данных (.db, .sqlite)
          </label>
          <DropZone accept={['.db', '.sqlite']} disabled={loading} hint="Файл БД" onFile={setDbFile} />
          {dbFile && <div style={{ fontSize: '12px', color: '#27ae60', marginTop: '4px' }}>{dbFile.name}</div>}
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 'bold' }}>
            Модель (.json)
          </label>
          <DropZone accept={['.json']} disabled={loading} hint="Файл модели" onFile={setModelFile} />
          {modelFile && <div style={{ fontSize: '12px', color: '#27ae60', marginTop: '4px' }}>{modelFile.name}</div>}
        </div>
      </div>

      <button
        onClick={handleRun}
        disabled={disabled}
        style={{
          padding: '10px 24px', backgroundColor: disabled ? '#ccc' : '#007bff',
          color: 'white', border: 'none', borderRadius: '4px',
          cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '14px',
        }}
      >
        {loading ? 'Выполняется...' : 'Запустить инференс'}
      </button>

      {error && (
        <div style={{ marginTop: '12px', padding: '10px', background: '#e74c3c', color: 'white', borderRadius: '6px' }}>
          {error}
        </div>
      )}

      {result && <InferenceResultView result={result} modelType={modelType} />}
    </div>
  );
};

export default InferencePanel;
