import { getSupabaseAnon } from "./supabase";
import type { PostKind } from "./posts";

/**
 * 테마별 일지(주식/운동) 데이터 계층.
 * 일지는 posts(kind=stock|workout)로 저장하고, 일지 전용 구조화 값은 posts.data(jsonb)에 둔다.
 *  - 주식: { pnl: 실현손익(원), tickers: 종목[] }
 *  - 운동: { exercises: [{ name, sets:[{weight,reps}] }] }  → 볼륨 = Σ weight*reps
 */

export interface StockData {
  pnl?: number;
  tickers?: string[];
}

export interface WorkoutSet {
  weight: number;
  reps: number;
}
export interface WorkoutExercise {
  name: string;
  sets: WorkoutSet[];
}
export interface WorkoutData {
  exercises?: WorkoutExercise[];
}

export interface JournalListItem {
  id: string;
  slug: string | null;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  tags: string[];
  entry_date: string | null;
  published_at: string | null;
  data: Record<string, unknown>;
}

const JOURNAL_COLUMNS =
  "id, slug, title, excerpt, cover_image_url, tags, entry_date, published_at, data";

export async function getPublishedJournal(
  kind: Extract<PostKind, "stock" | "workout">,
): Promise<JournalListItem[]> {
  const supabase = getSupabaseAnon();
  const { data, error } = await supabase
    .from("posts")
    .select(JOURNAL_COLUMNS)
    .eq("kind", kind)
    .eq("status", "published")
    .eq("is_public", true)
    .order("entry_date", { ascending: false, nullsFirst: false })
    .order("published_at", { ascending: false, nullsFirst: false });
  if (error) throw new Error(`일지 조회 실패: ${error.message}`);
  return (data ?? []) as JournalListItem[];
}

// ── 파생 계산 ──────────────────────────────────────────
export function stockPnl(data: Record<string, unknown> | null): number {
  const v = (data as StockData | null)?.pnl;
  return typeof v === "number" ? v : 0;
}

export function workoutExercises(
  data: Record<string, unknown> | null,
): WorkoutExercise[] {
  const ex = (data as WorkoutData | null)?.exercises;
  return Array.isArray(ex) ? ex : [];
}

export function workoutVolume(data: Record<string, unknown> | null): number {
  let v = 0;
  for (const e of workoutExercises(data)) {
    for (const s of e.sets ?? []) {
      v += (Number(s.weight) || 0) * (Number(s.reps) || 0);
    }
  }
  return v;
}

// ── 간단 통계 (Phase 5 — 차트는 Phase 7) ───────────────
function isInCurrentMonth(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}
function isWithinDays(dateStr: string | null, days: number): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr).getTime();
  const now = Date.now();
  return now - d <= days * 24 * 60 * 60 * 1000 && d <= now;
}

export interface StockStats {
  count: number;
  totalPnl: number;
  monthPnl: number;
  winRate: number | null; // 0~1, 손익 기록이 없으면 null
}
export function computeStockStats(items: JournalListItem[]): StockStats {
  let totalPnl = 0;
  let monthPnl = 0;
  let wins = 0;
  let withPnl = 0;
  for (const it of items) {
    const pnl = stockPnl(it.data);
    totalPnl += pnl;
    if (isInCurrentMonth(it.entry_date)) monthPnl += pnl;
    if (pnl !== 0) {
      withPnl += 1;
      if (pnl > 0) wins += 1;
    }
  }
  return {
    count: items.length,
    totalPnl,
    monthPnl,
    winRate: withPnl > 0 ? wins / withPnl : null,
  };
}

export interface WorkoutStats {
  count: number;
  totalVolume: number;
  weekCount: number;
}
export function computeWorkoutStats(items: JournalListItem[]): WorkoutStats {
  let totalVolume = 0;
  let weekCount = 0;
  for (const it of items) {
    totalVolume += workoutVolume(it.data);
    if (isWithinDays(it.entry_date, 7)) weekCount += 1;
  }
  return { count: items.length, totalVolume, weekCount };
}
