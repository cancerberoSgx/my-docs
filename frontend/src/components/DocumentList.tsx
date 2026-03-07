import { useEffect, useState } from 'react';
import { getDocuments } from '../api';
import { useAuthStore } from '../store';

interface Doc {
  id: number;
  userId: number;
  url: string;
  platform: string;
}

export default function DocumentList() {
  const token = useAuthStore((s) => s.token)!;
  const clearToken = useAuthStore((s) => s.clearToken);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getDocuments(token)
      .then(setDocs)
      .catch((err) => {
        if (err.message === 'Unauthorized' || err.message === 'Invalid or expired token') {
          clearToken();
        } else {
          setError(err.message);
        }
      })
      .finally(() => setLoading(false));
  }, [token, clearToken]);

  return (
    <div className="min-h-screen bg-base-200 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">My Documents</h1>
          <button className="btn btn-ghost btn-sm" onClick={clearToken}>
            Sign out
          </button>
        </div>

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
