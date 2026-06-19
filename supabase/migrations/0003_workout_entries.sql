-- ============================================================
-- mangoday 운동 일지 v2 (Phase 5 개선)
-- "운동 1개 = 독립 기록", 같은 entry_date 끼리 모아 '하루 운동일지'로 표시.
-- 기존 posts(kind='workout') 방식 대체. Supabase SQL Editor 에 붙여넣고 Run.
-- ============================================================

create table if not exists public.workout_entries (
  id          uuid primary key default gen_random_uuid(),
  entry_date  date not null,
  name        text not null,                 -- 운동명 (한글 음차 또는 직접입력)
  sets        jsonb not null default '[]'::jsonb,  -- [{ "weight": 60, "reps": 10 }, ...]
  note        text,                          -- 운동별 메모(선택)
  exercise_id text,                          -- ExerciseDB 운동 id (선택 시)
  gif_url     text,                          -- 동작 GIF (선택 시)
  is_public   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- 이미 0003 을 먼저 돌린 경우를 위한 컬럼 추가(안전)
alter table public.workout_entries add column if not exists exercise_id text;
alter table public.workout_entries add column if not exists gif_url text;

create index if not exists workout_entries_date_idx
  on public.workout_entries (entry_date desc, created_at);

-- RLS: 공개 항목만 누구나 읽기. 쓰기/삭제는 서버(service_role)가 RLS 우회.
alter table public.workout_entries enable row level security;

drop policy if exists "workout_entries public read" on public.workout_entries;
create policy "workout_entries public read" on public.workout_entries
  for select to anon, authenticated
  using (is_public = true);
