import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { SimilarResult } from '../../domain/types';

const RoutesPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const similarResult: SimilarResult | null = location.state?.similarResult ?? null;

  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(similarResult?.[0]?.id ?? null);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set([similarResult?.[0]?.id ?? -1]));
  const [expandedRoutes, setExpandedRoutes] = useState<Set<string>>(new Set());
  const [expandedSegments, setExpandedSegments] = useState<Set<string>>(new Set());

  if (!similarResult) {
    return (
      <div style={{ padding: '20px' }}>
        <p>Нет данных. <button onClick={() => navigate('/')}>Загрузить базу данных</button></p>
      </div>
    );
  }

  const toggle = (set: Set<any>, key: any, setter: React.Dispatch<React.SetStateAction<Set<any>>>) => {
    const next = new Set(set);
    next.has(key) ? next.delete(key) : next.add(key);
    setter(next);
  };

  const selectedGroup = similarResult.find(g => g.id === selectedGroupId);

  return (
    <div style={{ padding: '20px' }}>
      <button onClick={() => navigate('/')} style={{ marginBottom: '16px', padding: '6px 14px', cursor: 'pointer' }}>
        ← Назад
      </button>
      <h2>Группы похожих маршрутов ({similarResult.length})</h2>

      <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
        {/* Левая панель — дерево */}
        <div style={{ width: '300px', flexShrink: 0, border: '1px solid var(--border)', borderRadius: '4px', padding: '10px', maxHeight: '610px', overflowY: 'auto' }}>
          {similarResult.map((group) => {
            const isExpanded = expandedGroups.has(group.id);
            const isSelected = group.id === selectedGroupId;
            return (
              <div key={group.id} style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => toggle(expandedGroups, group.id, setExpandedGroups as any)}
                    style={{ width: '20px', height: '20px', border: '1px solid #999', background: 'transparent', cursor: 'pointer', fontSize: '12px', padding: 0 }}
                  >
                    {isExpanded ? '−' : '+'}
                  </button>
                  <button
                    onClick={() => setSelectedGroupId(group.id)}
                    style={{ flex: 1, padding: '6px 10px', border: 'none', background: isSelected ? '#007bff' : 'transparent', color: isSelected ? 'white' : 'var(--text)', textAlign: 'left', cursor: 'pointer', borderRadius: '3px', fontWeight: isSelected ? 'bold' : 'normal' }}
                  >
                    Группа #{group.id} ({group.routes.length} маршрутов)
                  </button>
                </div>

                {isExpanded && (
                  <div style={{ marginLeft: '28px', marginTop: '4px' }}>
                    {group.routes.map((route) => {
                      const isRouteExpanded = expandedRoutes.has(route.routeId);
                      return (
                        <div key={route.routeId} style={{ marginBottom: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              onClick={() => toggle(expandedRoutes, route.routeId, setExpandedRoutes as any)}
                              style={{ width: '16px', height: '16px', border: '1px solid #999', background: 'transparent', cursor: 'pointer', fontSize: '10px', padding: 0 }}
                            >
                              {isRouteExpanded ? '−' : '+'}
                            </button>
                            <span style={{ fontSize: '13px' }}>{route.name || route.routeId}</span>
                          </div>

                          {isRouteExpanded && (
                            <div style={{ marginLeft: '22px', marginTop: '2px' }}>
                              {route.segments.map((seg) => {
                                const isSegExpanded = expandedSegments.has(seg.segmentId);
                                return (
                                  <div key={seg.segmentId} style={{ marginBottom: '2px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <button
                                        onClick={() => toggle(expandedSegments, seg.segmentId, setExpandedSegments as any)}
                                        style={{ width: '14px', height: '14px', border: '1px solid #999', background: 'transparent', cursor: 'pointer', fontSize: '9px', padding: 0 }}
                                      >
                                        {isSegExpanded ? '−' : '+'}
                                      </button>
                                      <span style={{ fontSize: '12px' }}>{seg.name || seg.segmentId}</span>
                                      <span style={{ fontSize: '11px', color: '#888' }}>({seg.calibrations.length})</span>
                                    </div>

                                    {isSegExpanded && (
                                      <div style={{ marginLeft: '20px', marginTop: '2px' }}>
                                        {seg.calibrations.map((cal) => (
                                          <div key={cal.runId} style={{ fontSize: '11px', padding: '2px 4px', color: '#555' }}>
                                            📍 {new Date(cal.startedAtMillis).toLocaleDateString()} — {cal.source ?? 'N/A'}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Правая панель — детали выбранной группы */}
        {selectedGroup && (
          <div style={{ flex: 1 }}>
            <h3 style={{ marginTop: 0 }}>Группа #{selectedGroup.id}</h3>
            {selectedGroup.routes.map((route) => (
              <div key={route.routeId} style={{ marginBottom: '12px', padding: '10px', border: '1px solid var(--border)', borderRadius: '4px' }}>
                <strong>{route.name || route.routeId}</strong>
                <div style={{ marginTop: '6px', fontSize: '13px', color: '#888' }}>
                  {route.segments.length} сегментов · {route.segments.reduce((sum, s) => sum + s.calibrations.length, 0)} калибровок
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoutesPage;
