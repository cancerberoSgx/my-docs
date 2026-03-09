import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getDocumentHistory, HistoryEntry } from '../api';
import { useAuthStore } from '../store';
import { StatusBadge } from './StatusBadge';
import { DocumentStatus } from '../enums';
import Pagination from './Pagination';

const LIMIT = 20;
const STATUS_OPTIONS = ['', ...Object.values(DocumentStatus)] as const;

export default function DocumentHistoryPage() {
  const { docId } = useParams<{ docId: string }>();
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token)!;

  const [items, setItems] = useState<HistoryEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [offset, setOffset] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    getDocumentHistory(token, Number(docId), { limit: LIMIT, offset, status: statusFilter || undefined })
      .then(({ items: rows, total: t }) => { setItems(rows); setTotal(t); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, docId, offset, statusFilter]);

  function handleStatusFilter(s: string) {
    setStatusFilter(s);
    setOffset(0);
  }

  return (
    <div className="bg-base-200 min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <h1 className="text-2xl font-bold">Status changelog</h1>
        </div>

        {/* Status filter */}
        <div className="flex flex-wrap gap-1 items-center">
          <span className="text-xs font-semibold uppercase tracking-wide text-base-content/50 mr-1">Status</span>
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              className={`btn btn-xs ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => handleStatusFilter(s)}
            >
              {s || 'all'}
            </button>
          ))}
        </div>

        {error && <div className="alert alert-error text-sm"><span>{error}</span></div>}
        {loading && <div className="flex justify-center py-8"><span className="loading loading-spinner loading-lg" /></div>}

        {!loading && (
          <>
            <div className="overflow-x-auto rounded-lg shadow">
              <table className="table table-zebra bg-base-100 w-full">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Resolved URL</th>
                    <th>Mimetype</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan={5} className="text-center text-base-content/50 py-6">No history entries.</td></tr>
                  ) : items.map((entry) => (
                    <tr key={entry.id}>
                      <td className="text-base-content/50 text-xs">{entry.id}</td>
                      <td><StatusBadge status={entry.status} /></td>
                      <td className="text-xs text-base-content/60 whitespace-nowrap">
                        {new Date(entry.created_at).toLocaleString()}
                      </td>
                      <td className="max-w-xs">
                        {entry.resolved_url
                          ? <a href={entry.resolved_url} target="_blank" rel="noreferrer" className="link link-primary text-xs truncate block">{entry.resolved_url}</a>
                          : <span className="text-base-content/30 text-xs">—</span>}
                      </td>
                      <td className="text-xs text-base-content/60">
                        {entry.resolved_mimetype ?? <span className="text-base-content/30">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination offset={offset} limit={LIMIT} total={total} onChange={setOffset} />
          </>
        )}
      </div>
    </div>
  );
}
