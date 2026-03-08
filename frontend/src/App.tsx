import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from './store';
import Layout from './components/Layout';
import AuthForm from './components/AuthForm';
import ListsView from './components/ListsView';
import DocumentList from './components/DocumentList';
import DocumentPage from './components/DocumentPage';
import AccountPage from './components/AccountPage';
import SettingsPage from './components/SettingsPage';
import AdminUsersPage from './components/AdminUsersPage';
import AdminDocumentsPage from './components/AdminDocumentsPage';
import AdminListsPage from './components/AdminListsPage';
import { UserRole } from './enums';

function RequireRole({ role, children }: { role: UserRole; children: React.ReactNode }) {
  const storeRole = useAuthStore((s) => s.role);
  if (!storeRole) return <Navigate to="/login" replace />;
  if (storeRole !== role) return <Navigate to="/lists" replace />;
  return <>{children}</>;
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/login" element={<AuthForm initialMode="login" />} />
        <Route path="/register" element={<AuthForm initialMode="register" />} />
        <Route path="/lists" element={<RequireAuth><ListsView /></RequireAuth>} />
        <Route path="/lists/:listId" element={<RequireAuth><DocumentList /></RequireAuth>} />
        <Route path="/lists/:listId/documents/:docId" element={<RequireAuth><DocumentPage /></RequireAuth>} />
        <Route path="/account" element={<RequireAuth><AccountPage /></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
        <Route path="/admin/users" element={<RequireRole role={UserRole.Root}><AdminUsersPage /></RequireRole>} />
        <Route path="/admin/users/:userId" element={<RequireRole role={UserRole.Root}><AccountPage /></RequireRole>} />
        <Route path="/admin/documents" element={<RequireRole role={UserRole.Root}><AdminDocumentsPage /></RequireRole>} />
        <Route path="/admin/lists" element={<RequireRole role={UserRole.Root}><AdminListsPage /></RequireRole>} />
        <Route path="*" element={<Navigate to="/lists" replace />} />
      </Routes>
    </Layout>
  );
}
