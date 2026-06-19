import type { Metadata } from "next";
import Link from "next/link";
import { getPublicWorkoutDays, computeWorkoutStats } from "@/lib/workout";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "운동 일지",
  description: "mangoday의 운동 기록과 볼륨 추이",
};

export default async function WorkoutPage() {
  const days = await getPublicWorkoutDays();
  const stats = computeWorkoutStats(days);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">운동 일지</h1>
        <p className="mt-1 text-muted">날짜별 운동 기록과 볼륨</p>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="총 볼륨" value={`${stats.totalVolume.toLocaleString("ko-KR")}kg`} />
        <Stat label="이번 주 운동" value={`${stats.weekDayCount}일`} />
        <Stat label="기록한 날" value={`${stats.dayCount}일`} />
      </div>

      {days.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-10 text-center text-muted">
          아직 공개된 운동 기록이 없어요.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {days.map((day) => (
            <Link
              key={day.date}
              href={`/workout/${day.date}`}
              className="flex flex-col gap-2 rounded-xl border border-border bg-background p-4 transition hover:border-primary-300 hover:shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <time className="text-xs font-medium text-muted">
                  {formatDate(day.date)}
                </time>
                <span className="text-sm font-bold text-primary-700">
                  {day.volume.toLocaleString("ko-KR")}kg
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {day.entries.slice(0, 6).map((e) => (
                  <span
                    key={e.id}
                    className="rounded-md bg-primary-50 px-1.5 py-0.5 text-xs text-primary-700"
                  >
                    {e.name}
                  </span>
                ))}
                {day.entries.length > 6 && (
                  <span className="text-xs text-muted">+{day.entries.length - 6}</span>
                )}
              </div>
              <span className="mt-auto pt-1 text-xs text-muted">
                {day.exerciseCount}종목
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-lg font-bold">{value}</div>
    </div>
  );
}
