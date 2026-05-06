import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Datasets from './pages/Datasets';
import Validation from './pages/Validation';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/datasets" element={<Datasets />} />
      <Route path="/validation/:datasetId" element={<Validation />} />
    </Routes>
  );
}
