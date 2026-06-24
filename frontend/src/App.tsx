import { Routes, Route } from 'react-router-dom';
import UploadPage from './presentation/pages/UploadPage';
import RoutesPage from './presentation/pages/RoutesPage';
import InferencePage from './presentation/pages/InferencePage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<UploadPage />} />
      <Route path="/routes" element={<RoutesPage />} />
      <Route path="/inference" element={<InferencePage />} />
    </Routes>
  );
}

export default App;
