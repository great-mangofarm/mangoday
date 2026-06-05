"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarGrid } from "./CalendarGrid";
import {
  buildMonthGrid,
  expandOccurrences,
  toKstDate,
  toKstTime,
  type CalendarEvent,
  type Freq,
  type Occurrence,
} from "@/lib/calendar-core";
import {
  saveEvent,
  deleteEvent,
  toggleCompletion,
} from "@/lib/calendar-actions";

const MONTHS = ["", "1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
const WD = ["일", "월", "화", "수", "목", "금", "토"];
const COLORS = ["#f59e0b", "#3b82f6", "#22c55e", "#ef4444", "#a855f7", "#71717a"];

interface DialogState {
  id?: string;
  date: string;
}

export function AdminCalendar({
  ym,
  events,
  completionKeys,
  today,
}: {
  ym: string;
  events: CalendarEvent[];
  completionKeys: string[];
  today: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [completions, setCompletions] = useState<Set<string>>(
    () => new Set(completionKeys),
  );
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const grid = useMemo(() => buildMonthGrid(ym), [ym]);
  const byDate = useMemo(() => {
    const occ = expandOccurrences(events, grid.weeks[0][0], grid.weeks[5][6]);
    const map: Record<string, Occurrence[]> = {};
    for (const o of occ) (map[o.date] ??= []).push(o);
    return map;
  }, [events, grid]);

  const editingEvent = dialog?.id
    ? events.find((e) => e.id === dialog.id) ?? null
    : null;

  function go(targetYm: string) {
    router.push(`/admin/calendar?ym=${targetYm}`);
  }

  function toggle(occ: Occurrence) {
    const key = `${occ.event.id}:${occ.date}`;
    startTransition(async () => {
      const res = await toggleCompletion(occ.event.id, occ.date);
      if (res.ok) {
        setCompletions((prev) => {
          const n = new Set(prev);
          if (res.done) n.add(key);
          else n.delete(key);
          return n;
        });
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">
          {grid.year}년 {MONTHS[grid.month]}
        </h1>
        <div className="flex items-center gap-1">
          <button onClick={() => go(grid.prevYm)} className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface">←</button>
          <button onClick={() => go(today.slice(0, 7))} className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface">오늘</button>
          <button onClick={() => go(grid.nextYm)} className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface">→</button>
          <button
            onClick={() => setDialog({ date: today })}
            className="ml-2 rounded-lg bg-primary-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-primary-600"
          >
            + 일정
          </button>
        </div>
      </div>

      <CalendarGrid
        grid={grid}
        byDate={byDate}
        today={today}
        onDayClick={(date) => setDialog({ date })}
        renderChip={(occ) => {
          const done = completions.has(`${occ.event.id}:${occ.date}`);
          const color = occ.event.color || "#f59e0b";
          return (
            <span
              onClick={(e) => {
                e.stopPropagation();
                setDialog({ id: occ.event.id, date: occ.date });
              }}
              className={`flex cursor-pointer items-center gap-1 truncate rounded px-1 py-0.5 text-[11px] leading-tight hover:bg-surface ${done ? "opacity-50" : ""}`}
            >
              {occ.event.is_task ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(occ);
                  }}
                  className="shrink-0"
                  aria-label="수행 체크"
                >
                  {done ? "✅" : "⬜"}
                </button>
              ) : (
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
              )}
              <span className={`truncate ${done ? "line-through" : ""}`}>
                {occ.event.title}
              </span>
            </span>
          );
        }}
      />

      <p className="text-xs text-muted">
        날짜를 클릭하면 일정 추가, 일정을 클릭하면 수정. ✅는 할일(수행체크) 일정이에요.
      </p>

      {dialog && (
        <EventDialog
          key={dialog.id ?? dialog.date}
          initialDate={dialog.date}
          event={editingEvent}
          pending={isPending}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function EventDialog({
  initialDate,
  event,
  pending,
  onClose,
  onSaved,
}: {
  initialDate: string;
  event: CalendarEvent | null;
  pending: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const r = event?.recurrence ?? null;
  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [date, setDate] = useState(event ? toKstDate(event.start_at) : initialDate);
  const [allDay, setAllDay] = useState(event?.all_day ?? false);
  const [startTime, setStartTime] = useState(
    event && !event.all_day ? toKstTime(event.start_at) : "09:00",
  );
  const [endTime, setEndTime] = useState(
    event?.end_at ? toKstTime(event.end_at) : "",
  );
  const [isPublic, setIsPublic] = useState(event?.is_public ?? true);
  const [isTask, setIsTask] = useState(event?.is_task ?? false);
  const [color, setColor] = useState(event?.color ?? COLORS[0]);
  const [freq, setFreq] = useState<Freq>(r?.freq ?? "none");
  const [interval, setInterval] = useState(r?.interval ?? 1);
  const [byweekday, setByweekday] = useState<number[]>(r?.byweekday ?? []);
  const [until, setUntil] = useState(r?.until ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    setBusy(true);
    const res = await saveEvent({
      id: event?.id,
      title,
      description,
      date,
      allDay,
      startTime,
      endTime,
      isPublic,
      isTask,
      color,
      freq,
      interval,
      byweekday,
      until,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "저장 실패");
      return;
    }
    onSaved();
  }

  async function handleDelete() {
    if (!event) return;
    if (!window.confirm("이 일정을 삭제할까요? (반복이면 전체 삭제)")) return;
    setBusy(true);
    const res = await deleteEvent(event.id);
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "삭제 실패");
      return;
    }
    onSaved();
  }

  const toggleWd = (d: number) =>
    setByweekday((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort(),
    );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-background p-5 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-bold">{event ? "일정 수정" : "새 일정"}</h2>

        <div className="flex flex-col gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />

          <div className="flex gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-1.5 rounded-lg border border-border px-3 text-sm">
              <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} className="accent-primary-500" />
              종일
            </label>
          </div>

          {!allDay && (
            <div className="flex items-center gap-2 text-sm">
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2" />
              <span className="text-muted">~</span>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2" placeholder="종료(선택)" />
            </div>
          )}

          {/* 색상 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">색상</span>
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`h-6 w-6 rounded-full ${color === c ? "ring-2 ring-offset-1 ring-foreground" : ""}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          {/* 반복 */}
          <div className="flex items-center gap-2">
            <select value={freq} onChange={(e) => setFreq(e.target.value as Freq)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
              <option value="none">반복 안 함</option>
              <option value="daily">매일</option>
              <option value="weekly">매주</option>
              <option value="monthly">매월</option>
            </select>
            {freq !== "none" && (
              <label className="flex items-center gap-1 text-sm text-muted">
                <input type="number" min={1} value={interval} onChange={(e) => setInterval(Number(e.target.value) || 1)} className="w-14 rounded-lg border border-border bg-background px-2 py-2" />
                {freq === "daily" ? "일마다" : freq === "weekly" ? "주마다" : "개월마다"}
              </label>
            )}
          </div>

          {freq === "weekly" && (
            <div className="flex gap-1">
              {WD.map((w, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleWd(i)}
                  className={`h-8 w-8 rounded-full text-xs font-medium ${byweekday.includes(i) ? "bg-primary-500 text-white" : "border border-border text-muted"}`}
                >
                  {w}
                </button>
              ))}
            </div>
          )}

          {freq !== "none" && (
            <label className="flex items-center gap-2 text-sm text-muted">
              종료일
              <input type="date" value={until} onChange={(e) => setUntil(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-1.5" />
              <span className="text-xs">(비우면 계속)</span>
            </label>
          )}

          <div className="flex gap-4">
            <label className="flex items-center gap-1.5 text-sm">
              <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="accent-primary-500" />
              공개
            </label>
            <label className="flex items-center gap-1.5 text-sm">
              <input type="checkbox" checked={isTask} onChange={(e) => setIsTask(e.target.checked)} className="accent-primary-500" />
              할일(수행체크)
            </label>
          </div>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="메모(선택)"
            className="resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="mt-1 flex items-center justify-between gap-2">
            {event ? (
              <button onClick={handleDelete} disabled={busy || pending} className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50">삭제</button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-surface">취소</button>
              <button onClick={handleSave} disabled={busy || pending} className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-50">
                {busy ? "저장 중…" : "저장"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
