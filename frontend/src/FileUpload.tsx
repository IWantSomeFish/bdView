  import React, { useState } from 'react';
  import axios from 'axios';


  const FileUpload: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [response, setResponse] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Обработка выбора файла
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        setFile(files[0]);
        setError(null);
      }
    };

    // Отправка файла на бэкенд
    const handleUpload = async () => {
      if (!file) {
        setError('Пожалуйста, выберите файл');
        return;
      }

      const formData = new FormData();
      formData.append('database', file); // имя поля должно совпадать с бэкендом ("database")

      setUploading(true);
      setError(null);

      try {
        const response = await axios.post(
          `http://localhost:8080/api/parse`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        setResponse(response.data);
      } catch (err: any) {
        if (err.response) {
          setError(err.response.data.message || 'Ошибка загрузки файла');
        } else {
          setError('Ошибка сети');
        }
      } finally {
        setUploading(false);
      }
    };

    return (
      <div style={{ padding: '20px', maxWidth: '400px' }}>
        <h2>Загрузка SQLite базы данных</h2>

        <div style={{ marginBottom: '15px' }}>
          <input
            type="file"
            accept=".sqlite,.db" // ограничиваем типы файлов
            onChange={handleFileChange}
            disabled={uploading}
          />
        </div>

        {file && (
          <div style={{ marginBottom: '15px', fontSize: '14px' }}>
            Выбран файл: <strong>{file.name}</strong>
            <br />
            Размер: {(file.size / 1024).toFixed(2)} KB
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          style={{
            padding: '10px 20px',
            backgroundColor: uploading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: uploading ? 'not-allowed' : 'pointer',
          }}
        >
          {uploading ? 'Загрузка...' : 'Загрузить базу данных'}
        </button>

        {error && (
          <div style={{ color: 'red', marginTop: '15px' }}>
            Ошибка: {error}
          </div>
        )}

        {response && (
          <div
            style={{
              marginTop: '15px',
              padding: '10px',
              backgroundColor: '#e9f7ef',
              border: '1px solid #27ae60',
              borderRadius: '4px',
            }}
          >
            <h4>Успешно!</h4>
            <p>Статус: {response.status}</p>
            <p>Сообщение: {response.message}</p>
            {response.meta && (
              <div>
                <p>Имя файла: {response.meta.filename}</p>
                <p>Размер: {response.meta.size} байт</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  export default FileUpload;
