import { getSupabaseAdmin, getSupabaseAnon } from "./supabase";
import { stockPnl, workoutVolume } from "./journal";
import { expandOccurrences, toKstDate, todayKst, type CalendarEvent } from "./calendar-core";

/** 최근 n개월 "YYYY-MM" (현재 달 포함, KST) */
function lastNMonths(n: number): string[] {
  const [y, m] = todayKst().split("-").map(Number);
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    out.push(new Date(Date.UTC(y, m - 1 - i, 1)).toISOString().slice(0, 7));
  }
  return out;
}

interface PostRow {
  kind: "blog" | "stock" | "workout";
  status: string;
  published_at: string | null;
  entry_date: string | null;
  data: Record<string, unknown> | null;
}

function postMonth(p: PostRow): string | null {
  if (p.entry_date) return p.entry_date.slice(0, 7);
  if (p.published_at) return toKstDate(p.published_at).slice(0, 7);
  return null;
}

export interface AdminDashboard {
  months: string[];
  postsByKind: { blog: number; stock: number; workout: number };
  postsPerMonth: number[];
  stockPnlPerMonth: number[];
  workoutVolumePerMonth: number[];
  habit: { expected: number; done: number; rate: number | null };
  totals: { posts: number; published: number; tasks: number };
}

export async function getAdminDashboard(): Promise<AdminDashboard> {
  const sb = getSupabaseAdmin();
  const months = lastNMonths(6);
  const idx = new Map(months.map((m, i) => [m, i]));

  const { data: postData } = await sb
    .from("posts")
    .select("kind, status, published_at, entry_date, data");
  const rows = (postData ?? []) as PostRow[];

  const postsByKind = { blog: 0, stock: 0, workout: 0 };
  const postsPerMonth = months.map(() => 0);
  const stockPnlPerMonth = months.map(() => 0);
  const workoutVolumePerMonth = months.map(() => 0);
  let published = 0;

  for (const p of rows) {
    if (p.kind in postsByKind) postsByKind[p.kind] += 1;
    if (p.status === "published") published += 1;
    const mk = postMonth(p);
    const i = mk != null ? idx.get(mk) : undefined;
    if (i != null) {
      if (p.status === "published") postsPerMonth[i] += 1;
      if (p.kind === "stock") stockPnlPerMonth[i] += stockPnl(p.data);
      if (p.kind === "workout") workoutVolumePerMonth[i] += workoutVolume(p.data);
    }
  }

  // 이번 달 습관(할일) 수행률: 이번 달 1일~오늘 occurrence 대비 완료
  const { data: evData } = await sb
    .from("calendar_events")
    .select("id, title, description, start_at, end_at, all_day, is_public, is_task, recurrence, notify_at, color, created_at, updated_at")
    .eq("is_task", true);
  const events = (evData ?? []) as CalendarEvent[];
  const today = todayKst();
  const monthStart = `${today.slice(0, 7)}-01`;
  const occ = expandOccurrences(events, monthStart, today);
  const expected = occ.length;
  const { data: compData } = await sb
    .from("event_completions")
    .select("event_id, date")
    .gte("date", monthStart)
    .lte("date", today);
  const doneSet = new Set(
    (compData ?? []).map(
      (c) => `${(c as { event_id: string }).event_id}:${(c as { date: string }).date}`,
    ),
  );
  let done = 0;
  for (const o of occ) if (doneSet.has(`${o.event.id}:${o.date}`)) done += 1;

  return {
    months,
    postsByKind,
    postsPerMonth,
    stockPnlPerMonth,
    workoutVolumePerMonth,
    habit: { expected, done, rate: expected > 0 ? done / expected : null },
    totals: { posts: rows.length, published, tasks: events.length },
  };
}

/** 공개 메인용: 최근 6개월 공개 글/일지 발행 수 */
export async function getPublicActivity(): Promise<{
  months: string[];
  counts: number[];
}> {
  const sb = getSupabaseAnon();
  const months = lastNMonths(6);
  const idx = new Map(months.map((m, i) => [m, i]));
  const { data } = await sb
    .from("posts")
    .select("published_at, entry_date")
    .eq("status", "published")
    .eq("is_public", true);
  const counts = months.map(() => 0);
  for (const p of (data ?? []) as PostRow[]) {
    const mk = postMonth(p);
    const i = mk != null ? idx.get(mk) : undefined;
    if (i != null) counts[i] += 1;
  }
  return { months, counts };
}
