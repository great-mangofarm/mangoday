import type { Metadata } from "next";
import { getPublishedJournal, computeWorkoutStats } from "@/lib/journal";
import { JournalCard } from "@/components/journal/JournalCard";
import { formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "운동 일지",
  description: "mangoday의 운동 기록과 볼륨 추이",
};

export default async function WorkoutPage() {
  const items = await getPublishedJournal("workout");
  const stats = computeWorkoutStats(items);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">운동 일지</h1>
        <p className="mt-1 text-muted">운동 기록과 볼륨</p>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="총 볼륨" value={`${formatNumber(stats.totalVolume)}kg`} />
        <Stat label="이번 주 운동" value={`${stats.weekCount}회`} />
        <Stat label="기록" value={`${stats.count}개`} />
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-10 text-center text-muted">
          아직 공개된 운동 일지가 없어요.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <JournalCard key={item.id} kind="workout" item={item} />
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
