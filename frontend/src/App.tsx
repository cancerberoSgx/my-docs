import { useState } from 'react';
import { useAuthStore } from './store';
import AuthForm from './components/AuthForm';
import ListsView from './components/ListsView';
import DocumentList from './components/DocumentList';
import { DocList } from './api';

export default function App() {
  const token = useAuthStore((s) => s.token);
  const [selectedList, setSelectedList] = useState<DocList | null>(null);

  if (!token) return <AuthForm />;

  if (selectedList) {
    return (
      <DocumentList
        listId={selectedList.id}
        listName={selectedList.name}
        onBack={() => setSelectedList(null)}
      />
    );
  }

  return <ListsView onSelectList={setSelectedList} />;
}
