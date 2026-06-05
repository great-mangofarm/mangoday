import type { Metadata } from "next";
import Link from "next/link";
import {
  buildMonthGrid,
  expandOccurrences,
  getPublicEvents,
  todayKst,
  type Occurrence,
} from "@/lib/calendar";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "캘린더",
  description: "mangoday의 공개 일정",
};

const YM_RE = /^\d{4}-\d{2}$/;
const MONTHS = ["", "1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ ym?: string }>;
}) {
  const { ym: rawYm } = await searchParams;
  const ym = rawYm && YM_RE.test(rawYm) ? rawYm : todayKst().slice(0, 7);
  const grid = buildMonthGrid(ym);
  const events = await getPublicEvents();
  const from = grid.weeks[0][0];
  const to = grid.weeks[5][6];
  const occ = expandOccurrences(events, from, to);

  const byDate: Record<string, Occurrence[]> = {};
  for (const o of occ) (byDate[o.date] ??= []).push(o);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">
          {grid.year}년 {MONTHS[grid.month]}
        </h1>
        <div className="flex items-center gap-1">
          <Link
            href={`/calendar?ym=${grid.prevYm}`}
            className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface"
          >
            ←
          </Link>
          <Link
            href="/calendar"
            className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface"
          >
            오늘
          </Link>
          <Link
            href={`/calendar?ym=${grid.nextYm}`}
            className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface"
          >
            →
          </Link>
        </div>
      </div>

      <CalendarGrid grid={grid} byDate={byDate} today={todayKst()} />

      {occ.length === 0 && (
        <p className="text-center text-sm text-muted">이 달엔 공개된 일정이 없어요.</p>
      )}
    </div>
  );
}
