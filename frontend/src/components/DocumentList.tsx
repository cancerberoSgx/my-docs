import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getList, addDocument, getDocumentType, Doc } from '../api';
import { useAuthStore } from '../store';
import { DocTypeBadge } from './DocTypeIcon';
import { StatusBadge } from './StatusBadge';
import { DocumentStatus, DocumentType } from '../enums';

type StatusFilter = 'all' | DocumentStatus;
type TypeFilter = 'all' | DocumentType;

function FilterRow<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-base-content/50 w-14 shrink-0">
        {label}
      </span>
      <div className="flex flex-wrap gap-1">
        {options.map((opt) => (
          <button
            key={opt}
            className={`btn btn-xs ${value === opt ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => onChange(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

const STATUS_OPTIONS = ['all', ...Object.values(DocumentStatus)] as const;
const TYPE_OPTIONS = ['all', ...Object.values(DocumentType)] as const;

function AddDocumentModal({
  listId,
  onAdded,
  onClose,
}: {
  listId: number;
  onAdded: (doc: Doc) => void;
  onClose: () => void;
}) {
  const token = useAuthStore((s) => s.token)!;
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [detectedType, setDetectedType] = useState<string | null>(null);
  const [detectedTypeImage, setDetectedTypeImage] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const trimmed = url.trim();
    if (!trimmed) {
      setDetectedType(null);
      setDetectedTypeImage(null);
      setDetecting(false);
      return;
    }
    setDetecting(true);
    setDetectedType(null);
    const timer = setTimeout(() => {
      getDocumentType(trimmed)
        .then(({ type, type_image }) => {
          setDetectedType(type);
          setDetectedTypeImage(type_image);
        })
        .catch(() => { setDetectedType(DocumentType.Webpage); setDetectedTypeImage('/icons/webpage.svg'); })
        .finally(() => setDetecting(false));
    }, 400);
    return () => clearTimeout(timer);
  }, [url]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedUrl = url.trim();
    if (!trimmedUrl || detectedType === null) return;
    setAdding(true);
    setError('');
    addDocument(token, listId, trimmedUrl, detectedType, detectedType, description.trim() || null, detectedTypeImage)
      .then((doc) => { onAdded(doc); onClose(); })
      .catch((err) => setError(err.message))
      .finally(() => setAdding(false));
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Add document</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <input
              type="url"
              className="input input-bordered w-full"
              placeholder="https://…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={adding}
              autoFocus
            />
            <div className="mt-2 h-6 flex items-center gap-2">
              {detecting && <span className="loading loading-spinner loading-xs" />}
              {detectedType !== null && (
                <DocTypeBadge type={detectedType} type_image={detectedTypeImage} />
              )}
            </div>
          </div>

          <textarea
            className="textarea textarea-bordered w-full"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={adding}
            rows={2}
          />

          {error && <p className="text-error text-sm">{error}</p>}

          <div className="modal-action mt-0">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={adding}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={adding || !url.trim() || detecting || detectedType === null}
            >
              {adding ? <span className="loading loading-spinner loading-sm" /> : 'Save'}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
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
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

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
          <div className="flex gap-2">
            <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
              + Add
            </button>
            <button className="btn btn-ghost btn-sm" onClick={clearToken}>
              Sign out
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg" />
          </div>
        )}

        {error && <div className="alert alert-error"><span>{error}</span></div>}

        {!loading && !error && (
          <div className="card bg-base-100 shadow mb-4">
            <div className="card-body py-3 px-4 flex flex-col gap-2">
              <FilterRow label="Type" options={TYPE_OPTIONS} value={typeFilter} onChange={setTypeFilter} />
              <FilterRow label="Status" options={STATUS_OPTIONS} value={statusFilter} onChange={setStatusFilter} />
            </div>
          </div>
        )}

        {!loading && !error && docs.length === 0 && (
          <div className="card bg-base-100 shadow">
            <div className="card-body items-center text-center text-base-content/60">
              <p>No documents yet. Hit <strong>+ Add</strong> to get started.</p>
            </div>
          </div>
        )}

        {!loading && docs.length > 0 && (() => {
          const filtered = docs.filter((d) =>
            (statusFilter === 'all' || d.status === statusFilter) &&
            (typeFilter === 'all' || d.type === typeFilter)
          );
          return filtered.length === 0 ? (
            <div className="card bg-base-100 shadow">
              <div className="card-body items-center text-center text-base-content/60">
                <p>No documents match the current filters.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((doc) => (
                <button
                  key={doc.id}
                  className="card bg-base-100 shadow text-left w-full hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/lists/${listId}/documents/${doc.id}`)}
                >
                  <div className="card-body py-4">
                    <div className="flex items-start gap-3">
                      <DocTypeBadge type={doc.type || DocumentType.Webpage} type_image={doc.type_image} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm truncate text-primary">{doc.url}</p>
                        {doc.description && (
                          <p className="text-xs text-base-content/60 mt-0.5 line-clamp-2">{doc.description}</p>
                        )}
                      </div>
                      <StatusBadge status={doc.status} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          );
        })()}
      </div>

      {showModal && (
        <AddDocumentModal
          listId={listId}
          onAdded={(doc) => setDocs((prev) => [doc, ...prev])}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
