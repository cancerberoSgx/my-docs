import { useEffect, useState } from 'react';
import { adminGetLists, AdminList, Paginated } from '../api';
import { useAuthStore } from '../store';
import Pagination from './Pagination';

const LIMIT = 20;

export default function AdminListsPage() {
  const token = useAuthStore((s) => s.token)!;
  const [data, setData] = useState<Paginated<AdminList> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [offset, setOffset] = useState(0);
  const [orderBy, setOrderBy] = useState('created_at');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [nameFilter, setNameFilter] = useState('');
  const [nameInput, setNameInput] = useState('');

  function fetch() {
    setLoading(true);
    const params: Record<string, string | number> = { limit: LIMIT, offset, orderBy, order };
    if (nameFilter) params.name = nameFilter;
    adminGetLists(token, params)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(fetch, [offset, orderBy, order, nameFilter]);

  function toggleSort(col: string) {
    if (orderBy === col) setOrder((o) => o === 'asc' ? 'desc' : 'asc');
    else { setOrderBy(col); setOrder('asc'); }
    setOffset(0);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setNameFilter(nameInput);
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
      <div className="max-w-5xl mx-auto flex flex-col gap-4">
        <h1 className="text-2xl font-bold">All Lists</h1>

        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            className="input input-bordered input-sm flex-1 max-w-xs"
            placeholder="Filter by name…"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
          />
          <button type="submit" className="btn btn-sm btn-primary">Search</button>
          {nameFilter && (
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => { setNameFilter(''); setNameInput(''); setOffset(0); }}>
              Clear
            </button>
          )}
        </form>

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
                    <SortTh col="name" label="Name" />
                    <th>Description</th>
                    <SortTh col="created_at" label="Created" />
                    <SortTh col="updated_at" label="Updated" />
                  </tr>
                </thead>
                <tbody>
                  {data.items.length === 0 ? (
                    <tr><td colSpan={6} className="text-center text-base-content/50 py-6">No lists found.</td></tr>
                  ) : data.items.map((l) => (
                    <tr key={l.id}>
                      <td className="text-base-content/50 text-xs">{l.id}</td>
                      <td className="text-xs text-base-content/60">{l.user_id}</td>
                      <td className="font-medium">{l.name}</td>
                      <td className="text-sm text-base-content/60 max-w-xs truncate">{l.description ?? '—'}</td>
                      <td className="text-xs text-base-content/60">{new Date(l.created_at).toLocaleDateString()}</td>
                      <td className="text-xs text-base-content/60">{new Date(l.updated_at).toLocaleDateString()}</td>
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
