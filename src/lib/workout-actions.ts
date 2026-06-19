"use server";

import { requireAdmin } from "@/lib/auth/dal";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { WorkoutSet } from "@/lib/workout";

export interface WorkoutActionResult {
  ok: boolean;
  error?: string;
}

export async function addWorkoutEntry(input: {
  date: string;
  name: string;
  sets: WorkoutSet[];
  note: string;
  isPublic: boolean;
  exerciseId?: string | null;
  gifUrl?: string | null;
}): Promise<WorkoutActionResult> {
  await requireAdmin();
  const name = input.name.trim();
  if (!name) return { ok: false, error: "운동명을 입력해 주세요." };
  if (!input.date) return { ok: false, error: "날짜를 선택해 주세요." };

  const sets = (input.sets ?? [])
    .map((s) => ({ weight: Number(s.weight) || 0, reps: Number(s.reps) || 0 }))
    .filter((s) => s.reps > 0 || s.weight > 0);

  const sb = getSupabaseAdmin();
  const { error } = await sb.from("workout_entries").insert({
    entry_date: input.date,
    name,
    sets,
    note: input.note.trim() || null,
    exercise_id: input.exerciseId ?? null,
    gif_url: input.gifUrl ?? null,
    is_public: input.isPublic,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteWorkoutEntry(id: string): Promise<WorkoutActionResult> {
  await requireAdmin();
  const sb = getSupabaseAdmin();
  const { error } = await sb.from("workout_entries").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
