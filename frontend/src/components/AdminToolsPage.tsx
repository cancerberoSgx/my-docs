import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAllTools, getTool, ToolWithTypes } from '../api';
import { useAuthStore } from '../store';

export function AdminToolsPage() {
  const token = useAuthStore((s) => s.token)!;
  const navigate = useNavigate();
  const [tools, setTools] = useState<ToolWithTypes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getAllTools(token)
      .then(setTools)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="bg-base-200 min-h-screen px-4 py-8">
      <div className="max-w-3xl mx-auto flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Tools</h1>

        {error && <div className="alert alert-error text-sm"><span>{error}</span></div>}
        {loading && <div className="flex justify-center py-8"><span className="loading loading-spinner loading-lg" /></div>}

        {!loading && (
          <div className="overflow-x-auto rounded-lg shadow">
            <table className="table table-zebra bg-base-100 w-full">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Applies to</th>
                </tr>
              </thead>
              <tbody>
                {tools.length === 0 ? (
                  <tr><td colSpan={4} className="text-center text-base-content/50 py-6">No tools found.</td></tr>
                ) : tools.map((t) => (
                  <tr
                    key={t.id}
                    className="hover cursor-pointer"
                    onClick={() => navigate(`/admin/tools/${t.id}`)}
                  >
                    <td className="text-base-content/50 text-xs">{t.id}</td>
                    <td className="font-medium">{t.name}</td>
                    <td className="text-sm text-base-content/60">{t.description}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {t.documentTypes.map((dt) => (
                          <span key={dt} className="badge badge-sm badge-ghost">{dt}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminToolDetailPage() {
  const { toolId } = useParams<{ toolId: string }>();
  const token = useAuthStore((s) => s.token)!;
  const navigate = useNavigate();
  const [tool, setTool] = useState<ToolWithTypes | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getTool(token, Number(toolId))
      .then(setTool)
      .catch((e) => setError(e.message));
  }, [token, toolId]);

  return (
    <div className="bg-base-200 min-h-screen px-4 py-8">
      <div className="max-w-lg mx-auto flex flex-col gap-6">
        <button className="btn btn-ghost btn-sm self-start" onClick={() => navigate('/admin/tools')}>
          ← Back to tools
        </button>

        <h1 className="text-2xl font-bold">Tool details</h1>

        {error && <div className="alert alert-error text-sm"><span>{error}</span></div>}

        {tool && (
          <>
            <div className="card bg-base-100 shadow">
              <div className="card-body gap-2">
                <h2 className="card-title text-base">Info</h2>
                <div className="flex flex-col gap-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-base-content/60">ID</span>
                    <span className="font-medium text-base-content/50">{tool.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-base-content/60">Name</span>
                    <span className="font-medium">{tool.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-base-content/60">Description</span>
                    <span className="font-medium">{tool.description}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow">
              <div className="card-body gap-2">
                <h2 className="card-title text-base">Applies to document types</h2>
                <div className="flex flex-wrap gap-2 pt-1">
                  {tool.documentTypes.length === 0 ? (
                    <span className="text-sm text-base-content/50">No document types assigned.</span>
                  ) : tool.documentTypes.map((dt) => (
                    <span key={dt} className="badge badge-ghost">{dt}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="alert alert-info text-sm">
              <span>Tools are read-only. Adding, editing, or removing tools requires developer implementation.</span>
            </div>
          </>
        )}

        {!tool && !error && <span className="loading loading-spinner loading-lg mx-auto" />}
      </div>
    </div>
  );
}
