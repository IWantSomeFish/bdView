import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import RouteMap from '../components/RouteMap';
import type { ParseResult } from '../../domain/types';

const RoutesPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const result: ParseResult | null = location.state?.result ?? null;

  if (!result) {
    return (
      <div style={{ padding: '20px' }}>
        <p>Нет данных. <button onClick={() => navigate('/')}>Загрузить базу данных</button></p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <button
        onClick={() => navigate('/')}
        style={{ marginBottom: '16px', padding: '6px 14px', cursor: 'pointer' }}
      >
        ← Назад
      </button>
      <h2>Маршруты ({result.length})</h2>
      <RouteMap routes={result} />
    </div>
  );
};

export default RoutesPage;
