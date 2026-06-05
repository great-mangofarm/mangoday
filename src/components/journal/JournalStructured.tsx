import { formatPnl } from "@/lib/format";
import {
  stockPnl,
  workoutExercises,
  workoutVolume,
  type StockData,
} from "@/lib/journal";

/** 일지 상세 상단의 구조화 데이터 블록 (본문 위에 표시) */
export function JournalStructured({
  kind,
  data,
}: {
  kind: "stock" | "workout";
  data: Record<string, unknown>;
}) {
  if (kind === "stock") return <StockBlock data={data} />;
  return <WorkoutBlock data={data} />;
}

function StockBlock({ data }: { data: Record<string, unknown> }) {
  const pnl = stockPnl(data);
  const tickers = ((data as StockData)?.tickers ?? []) as string[];
  const color =
    pnl > 0 ? "text-red-600" : pnl < 0 ? "text-blue-600" : "text-foreground";

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-muted">실현 손익</span>
        <span className={`text-2xl font-bold ${color}`}>{formatPnl(pnl)}</span>
      </div>
      {tickers.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tickers.map((t) => (
            <span
              key={t}
              className="rounded-md border border-border bg-background px-2 py-0.5 text-sm font-medium"
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function WorkoutBlock({ data }: { data: Record<string, unknown> }) {
  const exercises = workoutExercises(data);
  const volume = workoutVolume(data);
  if (exercises.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <span className="text-xs font-semibold text-muted">운동 기록</span>
        <span className="text-sm font-bold text-primary-700">
          총 볼륨 {volume.toLocaleString("ko-KR")}kg
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {exercises.map((ex, i) => (
          <div key={i}>
            <div className="text-sm font-semibold">{ex.name}</div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {ex.sets.map((s, j) => (
                <span
                  key={j}
                  className="rounded-md border border-border bg-background px-2 py-0.5 text-xs text-muted"
                >
                  {s.weight}kg × {s.reps}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
