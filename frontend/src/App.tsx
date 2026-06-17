import React from 'react';
import { Routes, Route } from 'react-router-dom';
import UploadPage from './presentation/pages/UploadPage';
import RoutesPage from './presentation/pages/RoutesPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<UploadPage />} />
      <Route path="/routes" element={<RoutesPage />} />
    </Routes>
  );
}

export default App;
