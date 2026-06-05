import Link from "next/link";
import { formatDate, formatPnl } from "@/lib/format";
import {
  stockPnl,
  workoutVolume,
  workoutExercises,
  type JournalListItem,
} from "@/lib/journal";

export function JournalCard({
  kind,
  item,
}: {
  kind: "stock" | "workout";
  item: JournalListItem;
}) {
  const href = `/${kind}/${item.slug}`;
  const date = formatDate(item.entry_date ?? item.published_at);

  return (
    <Link
      href={href}
      className="flex flex-col gap-2 rounded-xl border border-border bg-background p-4 transition hover:border-primary-300 hover:shadow-sm"
    >
      <div className="flex items-center justify-between gap-2">
        <time className="text-xs font-medium text-muted">{date}</time>
        {kind === "stock" ? (
          <StockBadge pnl={stockPnl(item.data)} />
        ) : (
          <WorkoutBadge data={item.data} />
        )}
      </div>

      <h3 className="line-clamp-2 font-semibold leading-snug">
        {item.title || "(제목 없음)"}
      </h3>

      {item.excerpt && (
        <p className="line-clamp-2 text-sm text-muted">{item.excerpt}</p>
      )}

      {item.tags?.length > 0 && (
        <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
          {item.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-primary-50 px-1.5 py-0.5 text-xs text-primary-700"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

function StockBadge({ pnl }: { pnl: number }) {
  const color =
    pnl > 0 ? "text-red-600" : pnl < 0 ? "text-blue-600" : "text-muted";
  return <span className={`text-sm font-bold ${color}`}>{formatPnl(pnl)}</span>;
}

function WorkoutBadge({ data }: { data: Record<string, unknown> }) {
  const volume = workoutVolume(data);
  const count = workoutExercises(data).length;
  return (
    <span className="text-sm font-semibold text-primary-700">
      {volume.toLocaleString("ko-KR")}kg · {count}종목
    </span>
  );
}
