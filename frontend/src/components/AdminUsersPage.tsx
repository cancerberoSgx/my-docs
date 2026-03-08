import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminGetUsers, adminSetUserRole, AdminUser, Paginated } from '../api';
import { useAuthStore } from '../store';
import { UserRole } from '../enums';
import Pagination from './Pagination';

const LIMIT = 20;

export default function AdminUsersPage() {
  const token = useAuthStore((s) => s.token)!;
  const navigate = useNavigate();
  const [data, setData] = useState<Paginated<AdminUser> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [offset, setOffset] = useState(0);
  const [orderBy, setOrderBy] = useState<string>('created_at');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [emailFilter, setEmailFilter] = useState('');
  const [emailInput, setEmailInput] = useState('');

  const [roleUpdating, setRoleUpdating] = useState<number | null>(null);

  function fetch() {
    setLoading(true);
    const params: Record<string, string | number> = { limit: LIMIT, offset, orderBy, order };
    if (emailFilter) params.email = emailFilter;
    adminGetUsers(token, params)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(fetch, [offset, orderBy, order, emailFilter]);

  function toggleSort(col: string) {
    if (orderBy === col) setOrder((o) => o === 'asc' ? 'desc' : 'asc');
    else { setOrderBy(col); setOrder('asc'); }
    setOffset(0);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setEmailFilter(emailInput);
    setOffset(0);
  }

  function handleRoleChange(userId: number, role: string) {
    setRoleUpdating(userId);
    adminSetUserRole(token, userId, role)
      .then(() => {
        setData((d) => d ? {
          ...d,
          items: d.items.map((u) => u.id === userId ? { ...u, role } : u),
        } : d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setRoleUpdating(null));
  }

  function SortTh({ col, label }: { col: string; label: string }) {
    const active = orderBy === col;
    return (
      <th
        className="cursor-pointer select-none hover:bg-base-200 whitespace-nowrap"
        onClick={() => toggleSort(col)}
      >
        {label}{active ? (order === 'asc' ? ' ↑' : ' ↓') : ''}
      </th>
    );
  }

  return (
    <div className="bg-base-200 min-h-screen px-4 py-8">
      <div className="max-w-5xl mx-auto flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Users</h1>

        {/* Filter */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            className="input input-bordered input-sm flex-1 max-w-xs"
            placeholder="Filter by email…"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
          />
          <button type="submit" className="btn btn-sm btn-primary">Search</button>
          {emailFilter && (
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => { setEmailFilter(''); setEmailInput(''); setOffset(0); }}>
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
                    <SortTh col="email" label="Email" />
                    <SortTh col="role" label="Role" />
                    <SortTh col="created_at" label="Created" />
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.length === 0 ? (
                    <tr><td colSpan={5} className="text-center text-base-content/50 py-6">No users found.</td></tr>
                  ) : data.items.map((u) => (
                    <tr
                      key={u.id}
                      className="hover cursor-pointer"
                      onClick={() => navigate(`/admin/users/${u.id}`)}
                    >
                      <td className="text-base-content/50 text-xs">{u.id}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`badge badge-sm ${u.role === UserRole.Root ? 'badge-warning' : 'badge-ghost'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="text-xs text-base-content/60">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <select
                          className="select select-bordered select-xs"
                          value={u.role}
                          disabled={roleUpdating === u.id}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        >
                          {Object.values(UserRole).map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </td>
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
