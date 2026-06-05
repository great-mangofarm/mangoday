"use server";

import { requireAdmin } from "@/lib/auth/dal";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Freq } from "@/lib/calendar";

export interface EventActionResult {
  ok: boolean;
  error?: string;
  id?: string;
}

export interface SaveEventPayload {
  id?: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD (KST)
  allDay: boolean;
  startTime: string; // HH:MM (allDay면 무시)
  endTime: string; // HH:MM ("" 면 없음)
  isPublic: boolean;
  isTask: boolean;
  notify: boolean; // 시작 시각에 푸시 알림
  color: string; // "" 가능
  freq: Freq;
  interval: number;
  byweekday: number[];
  until: string; // YYYY-MM-DD ("" 면 무한)
}

function kstIso(date: string, time: string): string {
  return `${date}T${time}:00+09:00`;
}

export async function saveEvent(
  p: SaveEventPayload,
): Promise<EventActionResult> {
  await requireAdmin();
  const title = p.title.trim();
  if (!title) return { ok: false, error: "제목을 입력해 주세요." };
  if (!p.date) return { ok: false, error: "날짜를 선택해 주세요." };

  const start_at = p.allDay ? kstIso(p.date, "00:00") : kstIso(p.date, p.startTime || "09:00");
  const end_at =
    !p.allDay && p.endTime ? kstIso(p.date, p.endTime) : null;

  const recurrence =
    p.freq === "none"
      ? null
      : {
          freq: p.freq,
          interval: p.interval > 0 ? p.interval : 1,
          ...(p.freq === "weekly" && p.byweekday.length
            ? { byweekday: p.byweekday }
            : {}),
          ...(p.until ? { until: p.until } : {}),
        };

  const row = {
    title,
    description: p.description.trim() || null,
    start_at,
    end_at,
    all_day: p.allDay,
    is_public: p.isPublic,
    is_task: p.isTask,
    recurrence,
    color: p.color || null,
    notify_at: p.notify ? start_at : null,
    notified: false, // 저장 시 재무장
  };

  const sb = getSupabaseAdmin();
  try {
    if (p.id) {
      const { error } = await sb.from("calendar_events").update(row).eq("id", p.id);
      if (error) throw new Error(error.message);
      return { ok: true, id: p.id };
    }
    const { data, error } = await sb
      .from("calendar_events")
      .insert(row)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: (data as { id: string }).id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "저장 실패" };
  }
}

export async function deleteEvent(id: string): Promise<EventActionResult> {
  await requireAdmin();
  const sb = getSupabaseAdmin();
  const { error } = await sb.from("calendar_events").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** 수행 체크 토글 (있으면 해제, 없으면 완료) */
export async function toggleCompletion(
  eventId: string,
  date: string,
): Promise<EventActionResult & { done?: boolean }> {
  await requireAdmin();
  const sb = getSupabaseAdmin();
  const { data: existing, error: selErr } = await sb
    .from("event_completions")
    .select("id")
    .eq("event_id", eventId)
    .eq("date", date)
    .maybeSingle();
  if (selErr) return { ok: false, error: selErr.message };

  if (existing) {
    const { error } = await sb
      .from("event_completions")
      .delete()
      .eq("id", (existing as { id: string }).id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, done: false };
  }
  const { error } = await sb
    .from("event_completions")
    .insert({ event_id: eventId, date });
  if (error) return { ok: false, error: error.message };
  return { ok: true, done: true };
}
