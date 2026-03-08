export default function Pagination({
  offset,
  limit,
  total,
  onChange,
}: {
  offset: number;
  limit: number;
  total: number;
  onChange: (offset: number) => void;
}) {
  const page = Math.floor(offset / limit);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="flex items-center gap-3 text-sm">
      <button
        className="btn btn-ghost btn-xs"
        disabled={page === 0}
        onClick={() => onChange(Math.max(0, offset - limit))}
      >
        ← Prev
      </button>
      <span className="text-base-content/60">
        {page + 1} / {totalPages} &nbsp;·&nbsp; {total} total
      </span>
      <button
        className="btn btn-ghost btn-xs"
        disabled={page >= totalPages - 1}
        onClick={() => onChange(offset + limit)}
      >
        Next →
      </button>
    </div>
  );
}
