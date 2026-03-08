import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminGetDocuments, Doc, Paginated } from '../api';

type AdminDoc = Doc & { created_at: string };
import { useAuthStore } from '../store';
import { DocumentType } from '../enums';
import Pagination from './Pagination';

const LIMIT = 20;

export default function AdminDocumentsPage() {
  const token = useAuthStore((s) => s.token)!;
  const navigate = useNavigate();
  const [data, setData] = useState<Paginated<AdminDoc> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [offset, setOffset] = useState(0);
  const [orderBy, setOrderBy] = useState('created_at');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [urlFilter, setUrlFilter] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  function fetch() {
    setLoading(true);
    const params: Record<string, string | number> = { limit: LIMIT, offset, orderBy, order };
    if (urlFilter) params.url = urlFilter;
    if (typeFilter) params.type = typeFilter;
    adminGetDocuments(token, params)
      .then((d) => setData(d as Paginated<AdminDoc>))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(fetch, [offset, orderBy, order, urlFilter, typeFilter]);

  function toggleSort(col: string) {
    if (orderBy === col) setOrder((o) => o === 'asc' ? 'desc' : 'asc');
    else { setOrderBy(col); setOrder('asc'); }
    setOffset(0);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setUrlFilter(urlInput);
    setOffset(0);
  }

  function SortTh({ col, label }: { col: string; label: string }) {
    const active = orderBy === col;
    return (
      <th className="cursor-pointer select-none hover:bg-base-200 whitespace-nowrap" onClick={() => toggleSort(col)}>
        {label}{active ? (order === 'asc' ? ' ↑' : ' ↓') : ''}
      </th>
    );
  }

  return (
    <div className="bg-base-200 min-h-screen px-4 py-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-4">
        <h1 className="text-2xl font-bold">All Documents</h1>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-end">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              className="input input-bordered input-sm"
              placeholder="Filter by URL…"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
            />
            <button type="submit" className="btn btn-sm btn-primary">Search</button>
            {urlFilter && (
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => { setUrlFilter(''); setUrlInput(''); setOffset(0); }}>
                Clear
              </button>
            )}
          </form>
          <select
            className="select select-bordered select-sm"
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setOffset(0); }}
          >
            <option value="">All types</option>
            {Object.values(DocumentType).map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {error && <div className="alert alert-error text-sm"><span>{error}</span></div>}
        {loading && <div className="flex justify-center py-8"><span className="loading loading-spinner loading-lg" /></div>}

        {!loading && data && (
          <>
            <div className="overflow-x-auto rounded-lg shadow">
              <table className="table table-zebra bg-base-100 w-full">
                <thead>
                  <tr>
                    <SortTh col="id" label="ID" />
                    <th>User</th>
                    <SortTh col="url" label="URL" />
                    <SortTh col="type" label="Type" />
                    <th>Status</th>
                    <SortTh col="created_at" label="Created" />
                  </tr>
                </thead>
                <tbody>
                  {data.items.length === 0 ? (
                    <tr><td colSpan={6} className="text-center text-base-content/50 py-6">No documents found.</td></tr>
                  ) : data.items.map((d) => (
                    <tr
                      key={d.id}
                      className="hover cursor-pointer"
                      onClick={() => navigate(`/admin/documents/${d.id}`)}
                    >
                      <td className="text-base-content/50 text-xs">{d.id}</td>
                      <td className="text-xs text-base-content/60">{d.user_id}</td>
                      <td className="max-w-xs" onClick={(e) => e.stopPropagation()}>
                        <a href={d.url} target="_blank" rel="noreferrer" className="link link-primary text-xs truncate block">{d.url}</a>
                      </td>
                      <td><span className="badge badge-sm badge-ghost">{d.type}</span></td>
                      <td><span className="badge badge-sm badge-outline">{d.status}</span></td>
                      <td className="text-xs text-base-content/60">{new Date(d.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination offset={offset} limit={LIMIT} total={data.total} onChange={setOffset} />
          </>
        )}
      </div>
    </div>
  );
}
