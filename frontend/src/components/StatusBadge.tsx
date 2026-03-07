export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    empty: 'badge badge-neutral',
    pending: 'badge badge-warning gap-1',
    ready: 'badge badge-success',
    error: 'badge badge-error',
  };
  const cls = map[status] ?? 'badge badge-ghost';
  return (
    <span className={cls}>
      {status === 'pending' && <span className="loading loading-spinner loading-xs" />}
      {status}
    </span>
  );
}
