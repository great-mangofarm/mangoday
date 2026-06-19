import { requireAdmin } from "@/lib/auth/dal";
import { listEntriesByDate } from "@/lib/workout";
import { todayKst } from "@/lib/calendar-core";
import { WorkoutLogger } from "@/components/workout/WorkoutLogger";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function AdminWorkoutPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  await requireAdmin();
  const { date: raw } = await searchParams;
  const date = raw && DATE_RE.test(raw) ? raw : todayKst();
  const entries = await listEntriesByDate(date);

  return (
    <section className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold">운동 기록</h1>
      <WorkoutLogger date={date} entries={entries} />
    </section>
  );
}
