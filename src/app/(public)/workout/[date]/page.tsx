import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicWorkoutDay, entriesVolume, entryVolume } from "@/lib/workout";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type Props = { params: Promise<{ date: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { date } = await params;
  return {
    title: `${date} 운동`,
    description: `${date} 운동 기록`,
    alternates: { canonical: `/workout/${date}` },
  };
}

export default async function WorkoutDayPage({ params }: Props) {
  const { date } = await params;
  if (!DATE_RE.test(date)) notFound();
  const entries = await getPublicWorkoutDay(date);
  if (entries.length === 0) notFound();
  const volume = entriesVolume(entries);

  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-6">
      <nav className="text-sm text-muted">
        <Link href="/workout" className="hover:text-primary-600">
          ← 운동 일지
        </Link>
      </nav>

      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{formatDate(date)}</h1>
        <span className="text-sm font-bold text-primary-700">
          총 볼륨 {volume.toLocaleString("ko-KR")}kg
        </span>
      </header>

      <ul className="flex flex-col gap-3">
        {entries.map((e) => (
          <li key={e.id} className="flex gap-4 rounded-xl border border-border bg-background p-4">
            {e.gif_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={e.gif_url}
                alt={e.name}
                loading="lazy"
                className="h-20 w-20 shrink-0 rounded-lg border border-border bg-white object-cover"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">{e.name}</h2>
                <span className="text-xs text-muted">
                  {entryVolume(e.sets).toLocaleString("ko-KR")}kg
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {e.sets.map((s, i) => (
                  <span
                    key={i}
                    className="rounded-md border border-border bg-surface px-2 py-0.5 text-xs text-muted"
                  >
                    {s.weight}kg × {s.reps}
                  </span>
                ))}
              </div>
              {e.note && <p className="mt-2 text-sm text-muted">{e.note}</p>}
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}
