-- ============================================================
-- mangoday 초기 스키마 (Phase 1)
-- Supabase SQL Editor 에 통째로 붙여넣고 Run 하면 됩니다.
-- 안전하게 여러 번 실행해도 됩니다 (if not exists / drop policy if exists).
-- ============================================================

-- gen_random_uuid() 사용 (Supabase 기본 제공)
create extension if not exists pgcrypto;

-- updated_at 자동 갱신 함수
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- posts : 블로그 글 + 일지(주식/운동) 통합
-- ------------------------------------------------------------
create table if not exists public.posts (
  id              uuid primary key default gen_random_uuid(),
  kind            text not null default 'blog' check (kind in ('blog','stock','workout')),
  slug            text unique,
  title           text not null,
  content_json    jsonb,
  content_html    text,
  excerpt         text,
  cover_image_url text,
  status          text not null default 'draft' check (status in ('draft','published')),
  is_public       boolean not null default false,
  entry_date      date,
  data            jsonb not null default '{}'::jsonb,
  tags            text[] not null default '{}',
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists posts_tags_gin       on public.posts using gin (tags);
create index if not exists posts_kind_status_idx on public.posts (kind, status, is_public);
create index if not exists posts_published_idx   on public.posts (published_at desc);

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- comments : 덧글 (소셜 로그인 사용자, 작성은 서버에서 service_role 로)
-- ------------------------------------------------------------
create table if not exists public.comments (
  id              uuid primary key default gen_random_uuid(),
  post_id         uuid not null references public.posts(id) on delete cascade,
  parent_id       uuid references public.comments(id) on delete cascade,
  author_name     text not null,
  author_provider text not null,        -- google / kakao / naver
  author_key      text not null,        -- provider+id 식별자(동일인)
  author_image    text,
  content         text not null,
  status          text not null default 'visible' check (status in ('visible','hidden')),
  created_at      timestamptz not null default now()
);

create index if not exists comments_post_idx on public.comments (post_id, created_at);

-- ------------------------------------------------------------
-- calendar_events : 일정 (반복/공개토글/알림)
-- ------------------------------------------------------------
create table if not exists public.calendar_events (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  start_at    timestamptz not null,
  end_at      timestamptz,
  all_day     boolean not null default false,
  is_public   boolean not null default false,
  is_task     boolean not null default false,   -- 수행 체크 대상(반복 습관 등)
  recurrence  jsonb,                             -- { freq, interval, byweekday, until }
  notify_at   timestamptz,
  notified    boolean not null default false,
  color       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists events_start_idx  on public.calendar_events (start_at);
create index if not exists events_notify_idx  on public.calendar_events (notify_at) where notify_at is not null and notified = false;

drop trigger if exists events_set_updated_at on public.calendar_events;
create trigger events_set_updated_at
  before update on public.calendar_events
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- event_completions : 반복일정 회차별 수행 기록
-- ------------------------------------------------------------
create table if not exists public.event_completions (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references public.calendar_events(id) on delete cascade,
  date         date not null,
  completed_at timestamptz not null default now(),
  unique (event_id, date)
);

create index if not exists completions_event_idx on public.event_completions (event_id, date);

-- ------------------------------------------------------------
-- push_subscriptions : 웹푸시 구독 정보
-- ------------------------------------------------------------
create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  endpoint   text not null unique,
  keys       jsonb not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- RLS (Row Level Security)
--   - 모든 테이블 잠금 ON
--   - 공개 읽기 정책만 부여, 모든 쓰기는 서버(service_role)가 RLS 우회
-- ============================================================
alter table public.posts              enable row level security;
alter table public.comments           enable row level security;
alter table public.calendar_events    enable row level security;
alter table public.event_completions  enable row level security;
alter table public.push_subscriptions enable row level security;

-- posts: 발행 + 공개된 글만 누구나 읽기
drop policy if exists "posts public read" on public.posts;
create policy "posts public read" on public.posts
  for select to anon, authenticated
  using (status = 'published' and is_public = true);

-- comments: 보이는 덧글만 누구나 읽기 (작성/수정은 서버에서 처리)
drop policy if exists "comments public read" on public.comments;
create policy "comments public read" on public.comments
  for select to anon, authenticated
  using (status = 'visible');

-- calendar_events: 공개 일정만 누구나 읽기
drop policy if exists "events public read" on public.calendar_events;
create policy "events public read" on public.calendar_events
  for select to anon, authenticated
  using (is_public = true);

-- event_completions, push_subscriptions:
--   공개 정책 없음 → anon/authenticated 접근 차단. service_role 만 사용.
