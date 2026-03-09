import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getHistoryEntry, HistoryEntry } from '../api';
import { useAuthStore } from '../store';
import { StatusBadge } from './StatusBadge';

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 py-2 border-b border-base-200 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-wide text-base-content/50 w-32 shrink-0 pt-0.5">
        {label}
      </span>
      <div className="flex-1 text-sm break-all">{children}</div>
    </div>
  );
}

export default function DocumentHistoryDetailPage() {
  const { docId, entryId } = useParams<{ docId: string; entryId: string }>();
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token)!;

  const [entry, setEntry] = useState<HistoryEntry | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getHistoryEntry(token, Number(docId), Number(entryId))
      .then(setEntry)
      .catch((e) => setError(e.message));
  }, [token, docId, entryId]);

  return (
    <div className="bg-base-200 min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <h1 className="text-2xl font-bold">Status change detail</h1>
        </div>

        {error && <div className="alert alert-error text-sm"><span>{error}</span></div>}

        {!entry && !error && <span className="loading loading-spinner loading-lg mx-auto" />}

        {entry && (
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <DetailRow label="Entry ID">
                <span className="text-base-content/50">{entry.id}</span>
              </DetailRow>
              <DetailRow label="Document">
                <button
                  className="link link-primary text-sm"
                  onClick={() => navigate(`/documents/${entry.document_id}/history`)}
                >
                  #{entry.document_id}
                </button>
              </DetailRow>
              <DetailRow label="Date">
                {new Date(entry.created_at).toLocaleString()}
              </DetailRow>
              <DetailRow label="Status">
                <StatusBadge status={entry.status} />
              </DetailRow>
              <DetailRow label="Action">
                {entry.action
                  ? <span className="font-mono">{entry.action}</span>
                  : <span className="text-base-content/30">—</span>}
              </DetailRow>
              <DetailRow label="Params">
                {entry.params && Object.keys(entry.params).length > 0
                  ? <pre className="bg-base-200 rounded p-2 text-xs overflow-x-auto">{JSON.stringify(entry.params, null, 2)}</pre>
                  : <span className="text-base-content/30">—</span>}
              </DetailRow>
              <DetailRow label="Resolved URL">
                {entry.resolved_url
                  ? <a href={entry.resolved_url} target="_blank" rel="noreferrer" className="link link-primary">{entry.resolved_url}</a>
                  : <span className="text-base-content/30">—</span>}
              </DetailRow>
              <DetailRow label="Mimetype">
                {entry.resolved_mimetype ?? <span className="text-base-content/30">—</span>}
              </DetailRow>
              <DetailRow label="Extra">
                {entry.resolved_extra && Object.keys(entry.resolved_extra).length > 0
                  ? <pre className="bg-base-200 rounded p-2 text-xs overflow-x-auto">{JSON.stringify(entry.resolved_extra, null, 2)}</pre>
                  : <span className="text-base-content/30">—</span>}
              </DetailRow>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
