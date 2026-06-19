import { getSupabaseAnon, getSupabaseAdmin } from "./supabase";

/**
 * 운동 일지 v2 — 운동 1개 = 1 레코드(workout_entries), 같은 날짜끼리 묶어 '하루'로.
 * 읽기: anon + RLS(공개만). 쓰기/삭제: service role.
 */

export interface WorkoutSet {
  weight: number;
  reps: number;
}
export interface WorkoutEntry {
  id: string;
  entry_date: string; // YYYY-MM-DD
  name: string;
  sets: WorkoutSet[];
  note: string | null;
  exercise_id: string | null;
  gif_url: string | null;
  is_public: boolean;
  created_at: string;
}
export interface WorkoutDay {
  date: string;
  entries: WorkoutEntry[];
  volume: number;
  exerciseCount: number;
}

export function entryVolume(sets: WorkoutSet[]): number {
  return (sets ?? []).reduce(
    (s, x) => s + (Number(x.weight) || 0) * (Number(x.reps) || 0),
    0,
  );
}
export function entriesVolume(entries: WorkoutEntry[]): number {
  return entries.reduce((s, e) => s + entryVolume(e.sets), 0);
}

const COLS =
  "id, entry_date, name, sets, note, exercise_id, gif_url, is_public, created_at";

function groupByDate(entries: WorkoutEntry[]): WorkoutDay[] {
  const map = new Map<string, WorkoutEntry[]>();
  for (const e of entries) {
    const arr = map.get(e.entry_date) ?? [];
    arr.push(e);
    map.set(e.entry_date, arr);
  }
  return [...map.entries()]
    .map(([date, list]) => ({
      date,
      entries: list,
      volume: entriesVolume(list),
      exerciseCount: list.length,
    }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** 공개 운동 '날짜'들 (최신순) */
export async function getPublicWorkoutDays(): Promise<WorkoutDay[]> {
  const sb = getSupabaseAnon();
  const { data, error } = await sb
    .from("workout_entries")
    .select(COLS)
    .eq("is_public", true)
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) throw new Error(`운동 조회 실패: ${error.message}`);
  return groupByDate((data ?? []) as WorkoutEntry[]);
}

/** 특정 날짜의 공개 운동들 */
export async function getPublicWorkoutDay(date: string): Promise<WorkoutEntry[]> {
  const sb = getSupabaseAnon();
  const { data, error } = await sb
    .from("workout_entries")
    .select(COLS)
    .eq("is_public", true)
    .eq("entry_date", date)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`운동 조회 실패: ${error.message}`);
  return (data ?? []) as WorkoutEntry[];
}

/** 관리자: 특정 날짜의 모든 운동(비공개 포함) */
export async function listEntriesByDate(date: string): Promise<WorkoutEntry[]> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("workout_entries")
    .select(COLS)
    .eq("entry_date", date)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`운동 조회 실패: ${error.message}`);
  return (data ?? []) as WorkoutEntry[];
}

export interface WorkoutStats {
  totalVolume: number;
  dayCount: number;
  weekDayCount: number;
}
export function computeWorkoutStats(days: WorkoutDay[]): WorkoutStats {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  let totalVolume = 0;
  let weekDayCount = 0;
  for (const d of days) {
    totalVolume += d.volume;
    if (new Date(d.date).getTime() >= weekAgo) weekDayCount += 1;
  }
  return { totalVolume, dayCount: days.length, weekDayCount };
}
