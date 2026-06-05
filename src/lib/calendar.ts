import { getSupabaseAnon, getSupabaseAdmin } from "./supabase";
import type { CalendarEvent } from "./calendar-core";

/** 순수 로직/타입은 calendar-core 에서 (클라이언트 공용). 여기는 서버 데이터 접근만. */
export * from "./calendar-core";

const EVENT_COLUMNS =
  "id, title, description, start_at, end_at, all_day, is_public, is_task, recurrence, notify_at, color, created_at, updated_at";

export async function getPublicEvents(): Promise<CalendarEvent[]> {
  const sb = getSupabaseAnon();
  const { data, error } = await sb
    .from("calendar_events")
    .select(EVENT_COLUMNS)
    .eq("is_public", true);
  if (error) throw new Error(`일정 조회 실패: ${error.message}`);
  return (data ?? []) as CalendarEvent[];
}

export async function getAllEvents(): Promise<CalendarEvent[]> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("calendar_events")
    .select(EVENT_COLUMNS)
    .order("start_at", { ascending: true });
  if (error) throw new Error(`일정 조회 실패: ${error.message}`);
  return (data ?? []) as CalendarEvent[];
}

export async function getEventById(id: string): Promise<CalendarEvent | null> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("calendar_events")
    .select(EVENT_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`일정 조회 실패: ${error.message}`);
  return (data as CalendarEvent) ?? null;
}

/** event_completions: 완료된 "event_id:date" 키 집합 (service role) */
export async function getCompletions(from: string, to: string): Promise<string[]> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("event_completions")
    .select("event_id, date")
    .gte("date", from)
    .lte("date", to);
  if (error) throw new Error(`수행기록 조회 실패: ${error.message}`);
  return (data ?? []).map(
    (r) => `${(r as { event_id: string }).event_id}:${(r as { date: string }).date}`,
  );
}
