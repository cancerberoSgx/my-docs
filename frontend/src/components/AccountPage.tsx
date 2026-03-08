import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe, changePassword, deleteAccount, Me } from '../api';
import { useAuthStore } from '../store';

export default function AccountPage() {
  const token = useAuthStore((s) => s.token)!;
  const clearToken = useAuthStore((s) => s.clearToken);
  const navigate = useNavigate();

  const [me, setMe] = useState<Me | null>(null);
  const [loadError, setLoadError] = useState('');

  // Change password
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwOk, setPwOk] = useState(false);

  // Delete account
  const [showDelete, setShowDelete] = useState(false);
  const [deletePw, setDeletePw] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    getMe(token)
      .then(setMe)
      .catch((err) => {
        if (err.message === 'Unauthorized' || err.message === 'Invalid or expired token') {
          clearToken();
        } else {
          setLoadError(err.message);
        }
      });
  }, [token, clearToken]);

  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPw !== confirmPw) { setPwError('Passwords do not match'); return; }
    setPwSaving(true);
    setPwError('');
    setPwOk(false);
    changePassword(token, currentPw, newPw)
      .then(() => {
        setPwOk(true);
        setCurrentPw('');
        setNewPw('');
        setConfirmPw('');
      })
      .catch((err) => setPwError(err.message))
      .finally(() => setPwSaving(false));
  }

  function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault();
    setDeleting(true);
    setDeleteError('');
    deleteAccount(token, deletePw)
      .then(() => { clearToken(); navigate('/login'); })
      .catch((err) => setDeleteError(err.message))
      .finally(() => setDeleting(false));
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="alert alert-error max-w-sm"><span>{loadError}</span></div>
      </div>
    );
  }

  return (
    <div className="bg-base-200 min-h-screen px-4 py-8">
      <div className="max-w-lg mx-auto flex flex-col gap-6">
        <h1 className="text-2xl font-bold">Account</h1>

        {/* Account info */}
        <div className="card bg-base-100 shadow">
          <div className="card-body gap-2">
            <h2 className="card-title text-base">Account info</h2>
            {me ? (
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-base-content/60">Email</span>
                  <span className="font-medium">{me.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-content/60">Role</span>
                  <span className="font-medium">{me.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-content/60">ID</span>
                  <span className="font-medium text-base-content/50">{me.id}</span>
                </div>
              </div>
            ) : (
              <span className="loading loading-spinner loading-sm" />
            )}
          </div>
        </div>

        {/* Change password */}
        <div className="card bg-base-100 shadow">
          <div className="card-body gap-4">
            <h2 className="card-title text-base">Change password</h2>
            <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
              <input
                type="password"
                className="input input-bordered w-full"
                placeholder="Current password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                disabled={pwSaving}
                autoComplete="current-password"
              />
              <input
                type="password"
                className="input input-bordered w-full"
                placeholder="New password (min. 8 characters)"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                disabled={pwSaving}
                autoComplete="new-password"
              />
              <input
                type="password"
                className="input input-bordered w-full"
                placeholder="Confirm new password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                disabled={pwSaving}
                autoComplete="new-password"
              />
              {pwError && <p className="text-error text-sm">{pwError}</p>}
              {pwOk && <p className="text-success text-sm">Password updated.</p>}
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={pwSaving || !currentPw || !newPw || !confirmPw}
                >
                  {pwSaving ? <span className="loading loading-spinner loading-xs" /> : 'Update password'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Danger zone */}
        <div className="card bg-base-100 shadow border border-error/30">
          <div className="card-body gap-4">
            <h2 className="card-title text-base text-error">Danger zone</h2>
            {!showDelete ? (
              <button
                className="btn btn-outline btn-error btn-sm self-start"
                onClick={() => setShowDelete(true)}
              >
                Delete account
              </button>
            ) : (
              <form onSubmit={handleDeleteAccount} className="flex flex-col gap-3">
                <p className="text-sm text-base-content/70">
                  This will permanently delete your account and all your data. Enter your password to confirm.
                </p>
                <input
                  type="password"
                  className="input input-bordered input-error w-full"
                  placeholder="Your password"
                  value={deletePw}
                  onChange={(e) => setDeletePw(e.target.value)}
                  disabled={deleting}
                  autoComplete="current-password"
                />
                {deleteError && <p className="text-error text-sm">{deleteError}</p>}
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => { setShowDelete(false); setDeletePw(''); setDeleteError(''); }}
                    disabled={deleting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-error btn-sm"
                    disabled={deleting || !deletePw}
                  >
                    {deleting ? <span className="loading loading-spinner loading-xs" /> : 'Delete my account'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
