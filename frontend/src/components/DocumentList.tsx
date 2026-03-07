import { useEffect, useState } from 'react';
import { getList, addDocument, Doc } from '../api';
import { useAuthStore } from '../store';

interface Props {
  listId: number;
  listName: string;
  onBack: () => void;
}

export default function DocumentList({ listId, listName, onBack }: Props) {
  const token = useAuthStore((s) => s.token)!;
  const clearToken = useAuthStore((s) => s.clearToken);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  function detectPlatform(url: string): string {
    try {
      const host = new URL(url).hostname.replace(/^www\./, '');
      if (host.includes('youtube.com') || host === 'youtu.be') return 'youtube';
      if (host.includes('vimeo.com')) return 'vimeo';
      return host.split('.')[0];
    } catch {
      return 'unknown';
    }
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const url = newUrl.trim();
    if (!url) return;
    setAdding(true);
    setAddError('');
    addDocument(token, listId, url, detectPlatform(url))
      .then((doc) => {
        setDocs((prev) => [doc, ...prev]);
        setNewUrl('');
      })
      .catch((err) => setAddError(err.message))
      .finally(() => setAdding(false));
  }

  useEffect(() => {
    setLoading(true);
    getList(token, listId)
      .then((data) => setDocs(data.documents))
      .catch((err) => {
        if (err.message === 'Unauthorized' || err.message === 'Invalid or expired token') {
          clearToken();
        } else {
          setError(err.message);
        }
      })
      .finally(() => setLoading(false));
  }, [token, listId, clearToken]);

  return (
    <div className="min-h-screen bg-base-200 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button className="btn btn-ghost btn-sm" onClick={onBack}>
              ← Back
            </button>
            <h1 className="text-2xl font-bold">{listName}</h1>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={clearToken}>
            Sign out
          </button>
        </div>

        <form onSubmit={handleAdd} className="flex gap-2 mb-6">
          <input
            type="url"
            className="input input-bordered flex-1"
            placeholder="Paste an URL…"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            disabled={adding}
          />
          <button type="submit" className="btn btn-primary" disabled={adding || !newUrl.trim()}>
            {adding ? <span className="loading loading-spinner loading-sm" /> : 'Add'}
          </button>
        </form>

        {addError && (
          <div className="alert alert-error mb-4">
            <span>{addError}</span>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg" />
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && docs.length === 0 && (
          <div className="card bg-base-100 shadow">
            <div className="card-body items-center text-center text-base-content/60">
              <p>No documents yet.</p>
            </div>
          </div>
        )}

        {!loading && docs.length > 0 && (
          <div className="flex flex-col gap-3">
            {docs.map((doc) => (
              <div key={doc.id} className="card bg-base-100 shadow">
                <div className="card-body py-4">
                  <div className="flex items-center gap-3">
                    <span className="badge badge-outline">{doc.platform}</span>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="link link-primary truncate text-sm"
                    >
                      {doc.url}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
