import React, { useRef, useState } from 'react';

interface Props {
  accept: string[];
  disabled?: boolean;
  hint?: string;
  onFile: (file: File) => void;
}

const DropZone: React.FC<Props> = ({ accept, disabled = false, hint, onFile }) => {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isValid = (f: File) => accept.some(ext => f.name.endsWith(ext));

  const pick = (f: File) => {
    if (!isValid(f)) return;
    setFile(f);
    onFile(f);
  };

  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files[0];
        if (f && !disabled) pick(f);
      }}
      style={{
        marginBottom: '15px', padding: '30px',
        border: `2px dashed ${dragging ? '#007bff' : '#aaa'}`,
        borderRadius: '8px', backgroundColor: dragging ? '#e8f0fe' : 'var(--bg)',
        textAlign: 'center', cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s', userSelect: 'none',
      }}
    >
      {file
        ? <><strong>{file.name}</strong><br /><span style={{ fontSize: '13px', color: '#555' }}>{(file.size / (1024 * 1024)).toFixed(2)} MB</span></>
        : <span style={{ color: '#666' }}>
            Перетащите файл сюда или нажмите для выбора
            {hint && <><br /><small>{hint}</small></>}
          </span>
      }
      <input ref={inputRef} type="file" accept={accept.join(',')}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) pick(f); }}
        disabled={disabled} style={{ display: 'none' }} />
    </div>
  );
};

export default DropZone;
