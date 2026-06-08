import React, { useState } from 'react';

const PAGE_SIZE = 50;

interface Props {
  name: string;
  rows: Record<string, unknown>[];
}

const PaginatedTable: React.FC<Props> = ({ name, rows }) => {
  const [page, setPage] = useState(0);

  if (!rows.length) return <p>Таблица <strong>{name}</strong>: нет данных</p>;

  const columns = Object.keys(rows[0]);
  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const slice = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div style={{ marginTop: '20px' }}>
      <h3>{name} ({rows.length} строк)</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: '13px', width: '100%' }}>
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col} style={{ border: '1px solid #ccc', padding: '4px 8px', background: 'var(--bg)' }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((row, i) => (
              <tr key={i}>
                {columns.map(col => (
                  <td key={col} style={{ border: '1px solid #ccc', padding: '4px 8px', whiteSpace: 'nowrap' }}>
                    {String(row[col] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={() => setPage(p => p - 1)} disabled={page === 0}>◀ Пред.</button>
          <span>Стр. {page + 1} / {totalPages}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages - 1}>След. ▶</button>
        </div>
      )}
    </div>
  );
};

export default PaginatedTable;
