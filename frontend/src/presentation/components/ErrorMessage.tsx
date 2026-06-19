import React from 'react';

interface Props {
  message: string;
}

const ErrorMessage: React.FC<Props> = ({ message }) => (
  <div style={{ padding: '10px', marginTop: '10px', marginBottom: '10px', borderRadius: '6px', background: '#e74c3c', color: 'white' }}>
    {message}
  </div>
);

export default ErrorMessage;
