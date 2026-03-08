import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLists, createList, updateList, deleteList, DocList } from '../api';
import { useAuthStore } from '../store';

type SortField = 'name' | 'createdAt' | 'updatedAt';
type SortOrder = 'asc' | 'desc';

export default function ListsView() {
  const token = useAuthStore((s) => s.token)!;
  const navigate = useNavigate();
  const [lists, setLists] = useState<DocList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filter, setFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Create new list form
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Edit state: which list is being edited
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setLoading(true);
    getLists(token, sortField, sortOrder)
      .then(setLists)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, sortField, sortOrder]);

  const filtered = lists.filter((l) =>
    l.name.toLowerCase().includes(filter.toLowerCase())
  );

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createName.trim()) return;
    setCreating(true);
    setCreateError('');
    createList(token, createName.trim(), createDesc.trim())
      .then((list) => {
        setLists((prev) => [list, ...prev]);
        setCreateName('');
        setCreateDesc('');
        setShowCreate(false);
      })
      .catch((err) => setCreateError(err.message))
      .finally(() => setCreating(false));
  }

  function startEdit(list: DocList) {
    setEditId(list.id);
    setEditName(list.name);
    setEditDesc(list.description ?? '');
    setEditError('');
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editName.trim() || editId === null) return;
    setSaving(true);
    setEditError('');
    updateList(token, editId, editName.trim(), editDesc.trim())
      .then((updated) => {
        setLists((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
        setEditId(null);
      })
      .catch((err) => setEditError(err.message))
      .finally(() => setSaving(false));
  }

  function handleDelete() {
    if (deleteId === null) return;
    setDeleting(true);
    deleteList(token, deleteId)
      .then(() => {
        setLists((prev) => prev.filter((l) => l.id !== deleteId));
        setDeleteId(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setDeleting(false));
  }

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  }

  function sortLabel(field: SortField) {
    if (sortField !== field) return field;
    return `${field} ${sortOrder === 'asc' ? '↑' : '↓'}`;
  }

  return (
    <div className="min-h-screen bg-base-200 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">My Lists</h1>
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate((v) => !v)}>
            {showCreate ? 'Cancel' : 'New list'}
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <form onSubmit={handleCreate} className="card bg-base-100 shadow mb-6">
            <div className="card-body gap-3">
              <input
                className="input input-bordered"
                placeholder="List name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                disabled={creating}
                autoFocus
              />
              <input
                className="input input-bordered"
                placeholder="Description (optional)"
                value={createDesc}
                onChange={(e) => setCreateDesc(e.target.value)}
                disabled={creating}
              />
              {createError && <p className="text-error text-sm">{createError}</p>}
              <button
                type="submit"
                className="btn btn-primary btn-sm self-end"
                disabled={creating || !createName.trim()}
              >
                {creating ? <span className="loading loading-spinner loading-sm" /> : 'Create'}
              </button>
            </div>
          </form>
        )}

        {/* Filter + sort */}
        <div className="flex gap-2 mb-4">
          <input
            className="input input-bordered input-sm flex-1"
            placeholder="Filter by name…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <div className="flex gap-1">
            {(['name', 'createdAt', 'updatedAt'] as SortField[]).map((f) => (
              <button
                key={f}
                className={`btn btn-xs ${sortField === f ? 'btn-neutral' : 'btn-ghost'}`}
                onClick={() => toggleSort(f)}
              >
                {sortLabel(f)}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg" />
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="card bg-base-100 shadow">
            <div className="card-body items-center text-center text-base-content/60">
              <p>{lists.length === 0 ? 'No lists yet.' : 'No lists match your filter.'}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {filtered.map((list) =>
            editId === list.id ? (
              <form
                key={list.id}
                onSubmit={handleSave}
                className="card bg-base-100 shadow"
              >
                <div className="card-body gap-3">
                  <input
                    className="input input-bordered"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    disabled={saving}
                    autoFocus
                  />
                  <input
                    className="input input-bordered"
                    placeholder="Description (optional)"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    disabled={saving}
                  />
                  {editError && <p className="text-error text-sm">{editError}</p>}
                  <div className="flex gap-2 self-end">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setEditId(null)}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                      disabled={saving || !editName.trim()}
                    >
                      {saving ? <span className="loading loading-spinner loading-sm" /> : 'Save'}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div key={list.id} className="card bg-base-100 shadow">
                <div className="card-body py-4">
                  <div className="flex items-start justify-between gap-3">
                    <button
                      className="text-left flex-1"
                      onClick={() => navigate(`/lists/${list.id}`)}
                    >
                      <p className="font-semibold link link-hover">{list.name}</p>
                      {list.description && (
                        <p className="text-sm text-base-content/60 mt-0.5">{list.description}</p>
                      )}
                      <p className="text-xs text-base-content/40 mt-1">
                        Updated {new Date(list.updatedAt).toLocaleDateString()}
                      </p>
                    </button>
                    <div className="flex gap-1 shrink-0">
                      <button
                        className="btn btn-ghost btn-xs"
                        onClick={() => startEdit(list)}
                      >
                        Edit
                      </button>
                      {list.name !== 'default' && (
                        <button
                          className="btn btn-ghost btn-xs text-error"
                          onClick={() => setDeleteId(list.id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteId !== null && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Delete list?</h3>
            <p className="py-4 text-base-content/70">This action cannot be undone.</p>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)} disabled={deleting}>
                Cancel
              </button>
              <button className="btn btn-error" onClick={handleDelete} disabled={deleting}>
                {deleting ? <span className="loading loading-spinner loading-sm" /> : 'Delete'}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setDeleteId(null)} />
        </div>
      )}
    </div>
  );
}
