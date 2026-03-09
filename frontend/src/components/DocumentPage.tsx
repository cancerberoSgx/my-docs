import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getDocument, updateDocument, getDocumentType, getDocumentStatus, triggerDocumentAction, getToolsByType, getToolResults, Doc, DocumentStatus as DocumentStatusShape, ToolFull } from '../api';
import { DocumentStatus } from '../enums';
import { useAuthStore } from '../store';
import { DocTypeBadge } from './DocTypeIcon';
import { StatusBadge } from './StatusBadge';

export default function DocumentPage() {
  const { docId } = useParams<{ listId?: string; docId: string }>();
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
  const [tools, setTools] = useState<ToolFull[]>([]);
  const [toolResults, setToolResults] = useState<Record<string, string>>({});
  const [runningKey, setRunningKey] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function applyStatus(s: DocumentStatusShape) {
    setStatus(s.status);
    setStatusError(s.status_change_error);
    if (s.status === DocumentStatus.Ready) {
      getToolResults(token, Number(docId)).then(setToolResults).catch(() => {});
    }
  }

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
        getToolsByType(token, d.type).then(setTools).catch(() => {});
        getToolResults(token, d.id).then(setToolResults).catch(() => {});
        return getDocumentStatus(token, d.id).then(applyStatus).catch(() => {});
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
    if (status !== DocumentStatus.Pending) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      return;
    }
    pollRef.current = setInterval(() => {
      getDocumentStatus(token, Number(docId))
        .then(applyStatus)
        .catch(() => {});
    }, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [status, token, docId]);

  function handleRunTool(toolId: number, action: string) {
    const key = `${toolId}:${action}`;
    setRunningKey(key);
    triggerDocumentAction(token, Number(docId), toolId, action)
      .then(({ status: s }) => { setStatus(s); })
      .catch((err) => setStatusError(err.message))
      .finally(() => setRunningKey(null));
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
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <div className="flex items-center gap-2">
            <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/documents/${docId}/history`)}>
              History
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
              </div>
            </div>
            {status === DocumentStatus.Error && statusError && (
              <p className="text-error text-xs">{statusError}</p>
            )}

            {/* Tools */}
            {tools.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-base-content/50">Tools</p>
                {tools.map((tool) => (
                  <div key={tool.id} className="flex flex-col gap-1 py-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{tool.name}</p>
                        <p className="text-xs text-base-content/60">{tool.description}</p>
                      </div>
                      <div className="flex flex-wrap gap-1 shrink-0">
                        {tool.actions.map((act) => {
                          const key = `${tool.id}:${act.name}`;
                          return (
                            <button
                              key={act.name}
                              className="btn btn-xs btn-outline"
                              title={act.description}
                              onClick={() => handleRunTool(tool.id, act.name)}
                              disabled={runningKey !== null || status === DocumentStatus.Pending}
                            >
                              {runningKey === key
                                ? <span className="loading loading-spinner loading-xs" />
                                : act.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {toolResults[tool.name] && (
                      <a
                        href={toolResults[tool.name]}
                        target="_blank"
                        rel="noreferrer"
                        className="link link-primary text-xs truncate"
                      >
                        {toolResults[tool.name]}
                      </a>
                    )}
                  </div>
                ))}
              </div>
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
