import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from './store';
import AuthForm from './components/AuthForm';
import ListsView from './components/ListsView';
import DocumentList from './components/DocumentList';
import DocumentPage from './components/DocumentPage';

export default function App() {
  const token = useAuthStore((s) => s.token);

  if (!token) return <AuthForm />;

  return (
    <Routes>
      <Route path="/lists" element={<ListsView />} />
      <Route path="/lists/:listId" element={<DocumentList />} />
      <Route path="/lists/:listId/documents/:docId" element={<DocumentPage />} />
      <Route path="*" element={<Navigate to="/lists" replace />} />
    </Routes>
  );
}
