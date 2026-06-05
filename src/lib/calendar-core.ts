/**
 * 캘린더 순수 로직 (Supabase 미의존 → 클라이언트에서도 import 가능).
 * 날짜는 KST 기준 "YYYY-MM-DD" 문자열로 다룬다.
 */

export type Freq = "none" | "daily" | "weekly" | "monthly";

export interface Recurrence {
  freq: Freq;
  interval?: number;
  byweekday?: number[]; // 0=일 ~ 6=토
  until?: string | null;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string | null;
  all_day: boolean;
  is_public: boolean;
  is_task: boolean;
  recurrence: Recurrence | null;
  notify_at: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export interface Occurrence {
  event: CalendarEvent;
  date: string;
}

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY = 86400000;

export function toKstDate(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Date(d.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}
export function todayKst(): string {
  return toKstDate(new Date());
}
export function toKstTime(iso: string): string {
  return new Date(new Date(iso).getTime() + KST_OFFSET_MS)
    .toISOString()
    .slice(11, 16);
}
function ymdToUtc(s: string): number {
  const [y, m, d] = s.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}
function utcToYmd(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}
export function addDays(s: string, n: number): string {
  return utcToYmd(ymdToUtc(s) + n * DAY);
}
function daysBetween(a: string, b: string): number {
  return Math.round((ymdToUtc(b) - ymdToUtc(a)) / DAY);
}
function dow(s: string): number {
  return new Date(ymdToUtc(s)).getUTCDay();
}
function weekStartSun(s: string): string {
  return addDays(s, -dow(s));
}
function monthsBetween(a: string, b: string): number {
  const [ay, am] = a.split("-").map(Number);
  const [by, bm] = b.split("-").map(Number);
  return (by - ay) * 12 + (bm - am);
}

export interface MonthGrid {
  ym: string;
  year: number;
  month: number;
  prevYm: string;
  nextYm: string;
  weeks: string[][];
}
export function buildMonthGrid(ym: string): MonthGrid {
  const [year, month] = ym.split("-").map(Number);
  const gridStart = weekStartSun(`${ym}-01`);
  const weeks: string[][] = [];
  let cursor = gridStart;
  for (let w = 0; w < 6; w++) {
    const row: string[] = [];
    for (let d = 0; d < 7; d++) {
      row.push(cursor);
      cursor = addDays(cursor, 1);
    }
    weeks.push(row);
  }
  return {
    ym,
    year,
    month,
    prevYm: new Date(Date.UTC(year, month - 2, 1)).toISOString().slice(0, 7),
    nextYm: new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 7),
    weeks,
  };
}

function occursOn(e: CalendarEvent, date: string): boolean {
  const base = toKstDate(e.start_at);
  if (date < base) return false;
  const r = e.recurrence;
  if (r?.until && date > r.until) return false;
  if (!r || r.freq === "none") return date === base;
  const interval = r.interval && r.interval > 0 ? r.interval : 1;
  if (r.freq === "daily") return daysBetween(base, date) % interval === 0;
  if (r.freq === "weekly") {
    const set = r.byweekday?.length ? r.byweekday : [dow(base)];
    if (!set.includes(dow(date))) return false;
    return (daysBetween(weekStartSun(base), weekStartSun(date)) / 7) % interval === 0;
  }
  if (r.freq === "monthly") {
    if (Number(date.slice(8, 10)) !== Number(base.slice(8, 10))) return false;
    return monthsBetween(base, date) % interval === 0;
  }
  return false;
}

export function expandOccurrences(
  events: CalendarEvent[],
  from: string,
  to: string,
): Occurrence[] {
  const out: Occurrence[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) {
    for (const e of events) if (occursOn(e, d)) out.push({ event: e, date: d });
  }
  return out;
}
