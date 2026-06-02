import Link from "next/link";

export function TagBadge({ tag, count }: { tag: string; count?: number }) {
  return (
    <Link
      href={`/tags/${encodeURIComponent(tag)}`}
      className="inline-flex items-center gap-1 rounded-full border border-primary-200 bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-100"
    >
      #{tag}
      {typeof count === "number" && (
        <span className="text-primary-500">{count}</span>
      )}
    </Link>
  );
}
