import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getList, addDocument, getDocumentType, Doc } from '../api';
import { useAuthStore } from '../store';

function DocTypeIcon({ type }: { type: string }) {
  if (type === 'youtube') {
    return <img src="/icons/youtube.svg" alt="YouTube" className="w-4 h-4 inline-block" />;
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 inline-block opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20" />
    </svg>
  );
}

function DocTypeBadge({ type }: { type: string }) {
  return (
    <span className="inline-flex items-center gap-1 badge badge-outline">
      <DocTypeIcon type={type} />
      {type}
    </span>
  );
}

export default function DocumentList() {
  const { listId: listIdParam } = useParams<{ listId: string }>();
  const listId = Number(listIdParam);
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token)!;
  const clearToken = useAuthStore((s) => s.clearToken);
  const [listName, setListName] = useState('');
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [detectedType, setDetectedType] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    const url = newUrl.trim();
    if (!url) {
      setDetectedType(null);
      setDetecting(false);
      return;
    }
    setDetecting(true);
    setDetectedType(null);
    const timer = setTimeout(() => {
      getDocumentType(url)
        .then(({ type }) => setDetectedType(type))
        .catch(() => setDetectedType('unknown'))
        .finally(() => setDetecting(false));
    }, 400);
    return () => clearTimeout(timer);
  }, [newUrl]);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const url = newUrl.trim();
    if (!url || detectedType === null) return;
    setAdding(true);
    setAddError('');
    addDocument(token, listId, url, detectedType, detectedType)
      .then((doc) => {
        setDocs((prev) => [doc, ...prev]);
        setNewUrl('');
        setDetectedType(null);
      })
      .catch((err) => setAddError(err.message))
      .finally(() => setAdding(false));
  }

  useEffect(() => {
    setLoading(true);
    getList(token, listId)
      .then((data) => {
        setListName(data.name);
        setDocs(data.documents);
      })
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
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/lists')}>
              ← Back
            </button>
            <h1 className="text-2xl font-bold">{listName}</h1>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={clearToken}>
            Sign out
          </button>
        </div>

        <form onSubmit={handleAdd} className="mb-6">
          <div className="flex gap-2">
            <input
              type="url"
              className="input input-bordered flex-1"
              placeholder="Paste a URL…"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              disabled={adding}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={adding || !newUrl.trim() || detecting || detectedType === null}
            >
              {adding ? <span className="loading loading-spinner loading-sm" /> : 'Add'}
            </button>
          </div>
          {newUrl.trim() && (
            <div className="mt-2 h-6 flex items-center">
              {detecting && <span className="loading loading-spinner loading-xs mr-2" />}
              {detectedType !== null && <DocTypeBadge type={detectedType} />}
            </div>
          )}
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
                    <DocTypeBadge type={doc.type || 'unknown'} />
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
