import { DocumentStatus } from '../enums';

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    [DocumentStatus.Empty]: 'badge badge-neutral',
    [DocumentStatus.Pending]: 'badge badge-warning gap-1',
    [DocumentStatus.Ready]: 'badge badge-success',
    [DocumentStatus.Error]: 'badge badge-error',
  };
  const cls = map[status] ?? 'badge badge-ghost';
  return (
    <span className={cls}>
      {status === DocumentStatus.Pending && <span className="loading loading-spinner loading-xs" />}
      {status}
    </span>
  );
}
