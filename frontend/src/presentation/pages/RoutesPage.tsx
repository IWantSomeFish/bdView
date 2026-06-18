import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import RouteMap from '../components/RouteMap';
import type { ParseResult, SimilarResult } from '../../domain/types';

const RoutesPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const result: ParseResult | null = location.state?.result ?? null;
  const similarResult: SimilarResult | null = location.state?.similarResult ?? null;

  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [expandedRoutes, setExpandedRoutes] = useState<Set<string>>(new Set());
  const [expandedSegments, setExpandedSegments] = useState<Set<string>>(new Set());

  if (!result && !similarResult) {
    return (
      <div style={{ padding: '20px' }}>
        <p>Нет данных. <button onClick={() => navigate('/')}>Загрузить базу данных</button></p>
      </div>
    );
  }

  const toggle = (set: Set<any>, key: any, setter: (s: Set<any>) => void) => {
    const next = new Set(set);
    next.has(key) ? next.delete(key) : next.add(key);
    setter(next);
  };

  return (
    <div style={{ padding: '20px' }}>
      <button onClick={() => navigate('/')} style={{ marginBottom: '16px', padding: '6px 14px', cursor: 'pointer' }}>
        ← Назад
      </button>

      {/* Обычный режим /parse */}
      {result && (
        <>
          <h2>Маршруты ({result.length})</h2>
          <RouteMap routes={result} />
        </>
      )}

      {/* Режим /similar — иерархия: Группа → Маршрут → Сегмент → Калибровка */}
      {similarResult && (
        <>
          <h2>Группы похожих маршрутов ({similarResult.length})</h2>
          <div style={{ border: '1px solid var(--border)', borderRadius: '4px', padding: '10px', maxWidth: '600px' }}>
            {similarResult.map((group) => {
              const isGroupExpanded = expandedGroups.has(group.id);
              return (
                <div key={group.id} style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => toggle(expandedGroups, group.id, setExpandedGroups as any)}
                      style={{ width: '20px', height: '20px', border: '1px solid #999', background: 'transparent', cursor: 'pointer', fontSize: '12px', padding: 0 }}
                    >
                      {isGroupExpanded ? '−' : '+'}
                    </button>
                    <strong>Группа #{group.id}</strong>
                    <span style={{ fontSize: '13px', color: '#888' }}>({group.routes.length} маршрутов)</span>
                  </div>

                  {isGroupExpanded && (
                    <div style={{ marginLeft: '28px', marginTop: '4px' }}>
                      {group.routes.map((route) => {
                        const isRouteExpanded = expandedRoutes.has(route.routeId);
                        return (
                          <div key={route.routeId} style={{ marginBottom: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <button
                                onClick={() => toggle(expandedRoutes, route.routeId, setExpandedRoutes as any)}
                                style={{ width: '16px', height: '16px', border: '1px solid #999', background: 'transparent', cursor: 'pointer', fontSize: '10px', padding: 0 }}
                              >
                                {isRouteExpanded ? '−' : '+'}
                              </button>
                              <span style={{ fontSize: '14px' }}>{route.name || route.routeId}</span>
                            </div>

                            {isRouteExpanded && (
                              <div style={{ marginLeft: '24px', marginTop: '2px' }}>
                                {route.segments.map((seg) => {
                                  const isSegExpanded = expandedSegments.has(seg.segmentId);
                                  return (
                                    <div key={seg.segmentId} style={{ marginBottom: '2px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <button
                                          onClick={() => toggle(expandedSegments, seg.segmentId, setExpandedSegments as any)}
                                          style={{ width: '14px', height: '14px', border: '1px solid #999', background: 'transparent', cursor: 'pointer', fontSize: '9px', padding: 0 }}
                                        >
                                          {isSegExpanded ? '−' : '+'}
                                        </button>
                                        <span style={{ fontSize: '13px' }}>{seg.name || seg.segmentId}</span>
                                        <span style={{ fontSize: '12px', color: '#888' }}>({seg.calibrations.length} калибровок)</span>
                                      </div>

                                      {isSegExpanded && (
                                        <div style={{ marginLeft: '22px', marginTop: '2px' }}>
                                          {seg.calibrations.map((cal) => (
                                            <div key={cal.runId} style={{ fontSize: '12px', padding: '2px 6px', color: '#555' }}>
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
        </>
      )}
    </div>
  );
};

export default RoutesPage;
