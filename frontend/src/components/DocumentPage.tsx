import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getDocument, updateDocument, getDocumentType, Doc } from '../api';
import { useAuthStore } from '../store';
import { DocTypeBadge } from './DocTypeIcon';

export default function DocumentPage() {
  const { listId, docId } = useParams<{ listId: string; docId: string }>();
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token)!;
  const clearToken = useAuthStore((s) => s.clearToken);

  const [doc, setDoc] = useState<Doc | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // editable fields
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('');
  const [typeImage, setTypeImage] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [savedOk, setSavedOk] = useState(false);

  useEffect(() => {
    setLoading(true);
    getDocument(token, Number(docId))
      .then((d) => {
        setDoc(d);
        setUrl(d.url);
        setDescription(d.description ?? '');
        setType(d.type);
        setTypeImage(d.type_image);
      })
      .catch((err) => {
        if (err.message === 'Unauthorized' || err.message === 'Invalid or expired token') {
          clearToken();
        } else {
          setLoadError(err.message);
        }
      })
      .finally(() => setLoading(false));
  }, [token, docId, clearToken]);

  // re-detect type when URL changes away from the saved value
  useEffect(() => {
    const trimmed = url.trim();
    if (!trimmed || trimmed === doc?.url) return;
    setDetecting(true);
    const timer = setTimeout(() => {
      getDocumentType(trimmed)
        .then(({ type: t, type_image: ti }) => { setType(t); setTypeImage(ti); })
        .catch(() => {})
        .finally(() => setDetecting(false));
    }, 400);
    return () => clearTimeout(timer);
  }, [url, doc?.url]);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    setSaving(true);
    setSaveError('');
    setSavedOk(false);
    updateDocument(token, Number(docId), {
      url: trimmed,
      description: description.trim() || null,
      type,
      type_image: typeImage,
    })
      .then((updated) => {
        setDoc(updated);
        setSavedOk(true);
      })
      .catch((err) => setSaveError(err.message))
      .finally(() => setSaving(false));
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="alert alert-error max-w-sm"><span>{loadError}</span></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 px-4 py-8">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/lists/${listId}`)}>
            ← Back
          </button>
          <a
            href={url || doc?.url}
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost btn-sm gap-1"
          >
            Open ↗
          </a>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body gap-5">
            {/* Type badge */}
            <div className="flex items-center gap-2">
              <DocTypeBadge type={type} type_image={typeImage} />
              {detecting && <span className="loading loading-spinner loading-xs" />}
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text font-medium">URL</span>
                </div>
                <input
                  type="url"
                  className="input input-bordered w-full"
                  value={url}
                  onChange={(e) => { setUrl(e.target.value); setSavedOk(false); }}
                  disabled={saving}
                />
              </label>

              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text font-medium">Description</span>
                  <span className="label-text-alt text-base-content/40">optional</span>
                </div>
                <textarea
                  className="textarea textarea-bordered w-full"
                  placeholder="Add a description…"
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); setSavedOk(false); }}
                  disabled={saving}
                  rows={3}
                />
              </label>

              {saveError && <p className="text-error text-sm">{saveError}</p>}
              {savedOk && <p className="text-success text-sm">Saved.</p>}

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving || !url.trim() || detecting}
                >
                  {saving ? <span className="loading loading-spinner loading-sm" /> : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
