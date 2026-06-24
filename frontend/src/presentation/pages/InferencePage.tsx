import React from 'react';
import { useNavigate } from 'react-router-dom';
import InferencePanel from '../components/InferencePanel';

const InferencePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '20px' }}>
      <button
        onClick={() => navigate('/')}
        style={{ marginBottom: '16px', padding: '6px 14px', cursor: 'pointer' }}
      >
        ← Назад
      </button>

      <h2 style={{ marginTop: 0 }}>Инференс моделей</h2>
      <InferencePanel />
    </div>
  );
};

export default InferencePage;
