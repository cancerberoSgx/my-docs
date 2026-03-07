import { useAuthStore } from './store';
import AuthForm from './components/AuthForm';
import DocumentList from './components/DocumentList';

export default function App() {
  const token = useAuthStore((s) => s.token);
  return token ? <DocumentList /> : <AuthForm />;
}
