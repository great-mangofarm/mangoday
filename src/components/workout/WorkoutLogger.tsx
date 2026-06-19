"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addWorkoutEntry, deleteWorkoutEntry } from "@/lib/workout-actions";
import { entryVolume, entriesVolume, type WorkoutEntry, type WorkoutSet } from "@/lib/workout";
import { ExercisePicker, type PickedExercise } from "./ExercisePicker";

export function WorkoutLogger({
  date,
  entries,
}: {
  date: string;
  entries: WorkoutEntry[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [picked, setPicked] = useState<PickedExercise | null>(null);
  const [customMode, setCustomMode] = useState(false);
  const [customName, setCustomName] = useState("");
  const [sets, setSets] = useState<WorkoutSet[]>([{ weight: 0, reps: 0 }]);
  const [note, setNote] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dayVolume = entriesVolume(entries);
  const name = customMode ? customName : picked?.name ?? "";

  function changeDate(d: string) {
    router.push(`/admin/workout?date=${d}`);
  }
  function resetForm() {
    setPicked(null);
    setCustomName("");
    setSets([{ weight: 0, reps: 0 }]);
    setNote("");
  }
  function setField(i: number, f: "weight" | "reps", v: number) {
    setSets((p) => p.map((s, idx) => (idx === i ? { ...s, [f]: v } : s)));
  }

  function add() {
    setError(null);
    if (!name.trim()) {
      setError("운동을 선택하거나 직접 입력해 주세요.");
      return;
    }
    startTransition(async () => {
      const res = await addWorkoutEntry({
        date,
        name,
        sets,
        note,
        isPublic,
        exerciseId: customMode ? null : picked?.id ?? null,
        gifUrl: customMode ? null : picked?.gifUrl ?? null,
      });
      if (!res.ok) {
        setError(res.error ?? "추가 실패");
        return;
      }
      resetForm();
      router.refresh();
    });
  }

  function remove(id: string) {
    if (!window.confirm("이 운동을 삭제할까요?")) return;
    startTransition(async () => {
      const res = await deleteWorkoutEntry(id);
      if (res.ok) router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* 추가 영역 */}
      <div className="w-full shrink-0 lg:w-96">
        <div className="rounded-xl border border-border bg-background p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">운동 추가</h2>
            <input
              type="date"
              value={date}
              onChange={(e) => changeDate(e.target.value)}
              className="rounded-lg border border-border bg-background px-2 py-1 text-sm"
            />
          </div>

          {/* 운동 선택 / 직접입력 */}
          {!picked && !customMode && (
            <>
              <ExercisePicker onSelect={setPicked} />
              <button
                type="button"
                onClick={() => setCustomMode(true)}
                className="mt-2 text-xs font-medium text-primary-600 hover:underline"
              >
                목록에 없어요 — 직접 입력
              </button>
            </>
          )}

          {/* 선택된 운동 미리보기 */}
          {(picked || customMode) && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 rounded-lg border border-border p-2">
                {picked?.gifUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={picked.gifUrl}
                    alt={picked.name}
                    className="h-16 w-16 shrink-0 rounded-md border border-border bg-white object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  {customMode ? (
                    <input
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="운동명 직접 입력"
                      className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                    />
                  ) : (
                    <span className="font-semibold">{picked?.name}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setCustomMode(false);
                  }}
                  className="shrink-0 text-xs text-muted hover:text-foreground"
                >
                  변경
                </button>
              </div>

              {/* 세트 */}
              <div className="flex flex-col gap-1.5">
                {sets.map((s, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-sm">
                    <span className="w-8 text-xs text-muted">{i + 1}세트</span>
                    <input
                      type="number"
                      value={s.weight || ""}
                      onChange={(e) => setField(i, "weight", Number(e.target.value))}
                      placeholder="kg"
                      className="w-16 rounded-md border border-border bg-background px-2 py-1"
                    />
                    <span className="text-xs text-muted">kg ×</span>
                    <input
                      type="number"
                      value={s.reps || ""}
                      onChange={(e) => setField(i, "reps", Number(e.target.value))}
                      placeholder="회"
                      className="w-14 rounded-md border border-border bg-background px-2 py-1"
                    />
                    <span className="text-xs text-muted">회</span>
                    {sets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setSets((p) => p.filter((_, idx) => idx !== i))}
                        className="ml-auto text-xs text-muted hover:text-red-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setSets((p) => [...p, { weight: 0, reps: 0 }])}
                  className="self-start text-xs font-medium text-primary-600 hover:underline"
                >
                  + 세트 추가
                </button>
              </div>

              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="메모(선택)"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="accent-primary-500"
                />
                공개
              </label>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                onClick={add}
                disabled={isPending}
                className="w-full rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-50"
              >
                {isPending ? "추가 중…" : "+ 추가"}
              </button>
            </div>
          )}

          {error && !picked && !customMode && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>
      </div>

      {/* 그날의 운동 목록 */}
      <div className="min-w-0 flex-1">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-bold">{date} 운동</h2>
          <span className="text-sm font-semibold text-primary-700">
            총 볼륨 {dayVolume.toLocaleString("ko-KR")}kg · {entries.length}종목
          </span>
        </div>

        {entries.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-10 text-center text-muted">
            이 날 기록된 운동이 없어요. 왼쪽에서 하나씩 추가하세요.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {entries.map((e) => (
              <li key={e.id} className="flex gap-3 rounded-xl border border-border bg-background p-3">
                {e.gif_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={e.gif_url}
                    alt={e.name}
                    loading="lazy"
                    className="h-14 w-14 shrink-0 rounded-md border border-border bg-white object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">
                      {e.name}
                      {!e.is_public && (
                        <span className="ml-1.5 rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500">
                          비공개
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted">
                        {entryVolume(e.sets).toLocaleString("ko-KR")}kg
                      </span>
                      <button
                        onClick={() => remove(e.id)}
                        disabled={isPending}
                        className="text-xs text-muted hover:text-red-600"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {e.sets.map((s, i) => (
                      <span
                        key={i}
                        className="rounded-md border border-border bg-surface px-2 py-0.5 text-xs text-muted"
                      >
                        {s.weight}kg × {s.reps}
                      </span>
                    ))}
                  </div>
                  {e.note && <p className="mt-1.5 text-sm text-muted">{e.note}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
