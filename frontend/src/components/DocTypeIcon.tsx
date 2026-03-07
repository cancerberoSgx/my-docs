export function DocTypeIcon({ type, type_image }: { type: string; type_image?: string | null }) {
  if (type_image) {
    return <img src={type_image} alt={type} className="w-4 h-4 inline-block shrink-0" />;
  }
  // fallback globe
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 inline-block shrink-0 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20" />
    </svg>
  );
}

export function DocTypeBadge({ type, type_image }: { type: string; type_image?: string | null }) {
  return (
    <span className="inline-flex items-center gap-1 badge badge-outline capitalize shrink-0">
      <DocTypeIcon type={type} type_image={type_image} />
      {type}
    </span>
  );
}
