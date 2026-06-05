import type { MonthGrid, Occurrence } from "@/lib/calendar-core";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/**
 * 월 달력 표현 컴포넌트 (훅 없음 → 서버/클라이언트 공용).
 * onDayClick / renderChip 은 클라이언트 부모에서만 넘긴다.
 */
export function CalendarGrid({
  grid,
  byDate,
  today,
  onDayClick,
  renderChip,
}: {
  grid: MonthGrid;
  byDate: Record<string, Occurrence[]>;
  today: string;
  onDayClick?: (date: string) => void;
  renderChip?: (occ: Occurrence) => React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background">
      <div className="grid grid-cols-7 border-b border-border bg-surface text-center text-xs font-semibold">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={`py-2 ${i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-muted"}`}
          >
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {grid.weeks.flat().map((date, idx) => {
          const inMonth = date.slice(0, 7) === grid.ym;
          const isToday = date === today;
          const wd = idx % 7;
          const dayNum = Number(date.slice(8, 10));
          const occ = byDate[date] ?? [];
          return (
            <div
              key={date}
              onClick={onDayClick ? () => onDayClick(date) : undefined}
              className={`min-h-[84px] border-b border-r border-border p-1.5 last:border-r-0 ${
                inMonth ? "" : "bg-surface/60"
              } ${onDayClick ? "cursor-pointer hover:bg-surface" : ""}`}
            >
              <div
                className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  isToday ? "bg-primary-500 font-bold text-white" : ""
                } ${
                  !isToday && wd === 0
                    ? "text-red-500"
                    : !isToday && wd === 6
                      ? "text-blue-500"
                      : !isToday
                        ? "text-foreground"
                        : ""
                } ${!inMonth ? "opacity-40" : ""}`}
              >
                {dayNum}
              </div>
              <div className="flex flex-col gap-0.5">
                {occ.map((o, i) =>
                  renderChip ? (
                    <span key={`${o.event.id}-${i}`}>{renderChip(o)}</span>
                  ) : (
                    <DefaultChip key={`${o.event.id}-${i}`} occ={o} />
                  ),
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DefaultChip({ occ }: { occ: Occurrence }) {
  const color = occ.event.color || "#f59e0b";
  return (
    <span className="flex items-center gap-1 truncate rounded px-1 py-0.5 text-[11px] leading-tight">
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="truncate text-foreground">{occ.event.title}</span>
    </span>
  );
}
