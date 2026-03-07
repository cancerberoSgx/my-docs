import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getDocument, updateDocument, getDocumentType, getDocumentStatus, triggerDocumentAction, Doc } from '../api';
import { useAuthStore } from '../store';
import { DocTypeBadge } from './DocTypeIcon';
import { StatusBadge } from './StatusBadge';

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

  const [status, setStatus] = useState('');
  const [statusError, setStatusError] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
        setStatus(d.status);
        setStatusError(d.status_change_error);
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

  // Poll every 3s while pending
  useEffect(() => {
    if (status !== 'pending') {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      return;
    }
    pollRef.current = setInterval(() => {
      getDocumentStatus(token, Number(docId))
        .then(({ status: s, status_change_error: e }) => {
          setStatus(s);
          setStatusError(e);
        })
        .catch(() => {});
    }, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [status, token, docId]);

  function handlePrepare() {
    setPreparing(true);
    triggerDocumentAction(token, Number(docId), 'load')
      .then(({ status: s }) => setStatus(s))
      .catch((err) => setStatusError(err.message))
      .finally(() => setPreparing(false));
  }

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
            {/* Type badge + status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DocTypeBadge type={type} type_image={typeImage} />
                {detecting && <span className="loading loading-spinner loading-xs" />}
              </div>
              <div className="flex items-center gap-2">
                {status && <StatusBadge status={status} />}
                {doc?.type === 'youtube' && status === 'empty' && (
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={handlePrepare}
                    disabled={preparing}
                  >
                    {preparing ? <span className="loading loading-spinner loading-xs" /> : 'Prepare'}
                  </button>
                )}
              </div>
            </div>
            {status === 'error' && statusError && (
              <p className="text-error text-xs">{statusError}</p>
            )}

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
