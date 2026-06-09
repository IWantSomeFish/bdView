import React from 'react';

interface Props {
  message: string;
}

const ErrorMessage: React.FC<Props> = ({ message }) => (
  <div style={{ color: 'red', marginTop: '15px' }}>Ошибка: {message}</div>
);

export default ErrorMessage;
