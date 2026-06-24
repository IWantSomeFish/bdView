import React from 'react';
import type { InferenceResult, ModelType } from '../../domain/types';

interface Props {
  result: InferenceResult;
  modelType: ModelType;
}

const InferenceResultView: React.FC<Props> = ({ result, modelType }) => {
  if (modelType === 'wifi_filter' && Array.isArray(result)) {
    return (
      <div style={{ border: '1px solid var(--border)', borderRadius: '6px', padding: '16px', marginTop: '16px' }}>
        <h3 style={{ marginTop: 0 }}>Стабильные Wi-Fi сети ({result.length})</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {result.map(bssid => (
            <span key={bssid} style={{
              padding: '4px 8px', background: '#e3f2fd', borderRadius: '4px',
              fontSize: '12px', fontFamily: 'monospace',
            }}>
              {bssid}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (modelType === 'route_similarity' && !Array.isArray(result)) {
    const groups = Object.entries(result).filter(([, ids]) => ids.length > 0);
    return (
      <div style={{ border: '1px solid var(--border)', borderRadius: '6px', padding: '16px', marginTop: '16px' }}>
        <h3 style={{ marginTop: 0 }}>Похожие маршруты ({groups.length} групп)</h3>
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {groups.map(([runId, similarIds]) => (
            <div key={runId} style={{ marginBottom: '8px', padding: '8px', background: 'var(--bg)', borderRadius: '4px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{runId.slice(0, 8)}...</div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                Похожие: {similarIds.map(id => id.slice(0, 8)).join(', ')}...
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '6px', padding: '16px', marginTop: '16px' }}>
      <h3 style={{ marginTop: 0 }}>Результат</h3>
      <pre style={{ fontSize: '12px', fontFamily: 'monospace', margin: 0 }}>
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
};

export default InferenceResultView;
