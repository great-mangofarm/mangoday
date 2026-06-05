import { getSupabaseAdmin } from "@/lib/supabase";
import type { PostKind } from "@/lib/posts";

/**
 * 관리자용 글 데이터 계층 — service role(RLS 우회).
 * 반드시 서버(requireAdmin 통과 후)에서만 호출할 것.
 */

export interface AdminPostRow {
  id: string;
  kind: PostKind;
  slug: string | null;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  content_json: unknown;
  content_html: string | null;
  tags: string[];
  status: "draft" | "published";
  is_public: boolean;
  entry_date: string | null;
  data: Record<string, unknown>;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

const ADMIN_LIST_COLUMNS =
  "id, kind, slug, title, excerpt, cover_image_url, tags, status, is_public, entry_date, published_at, updated_at, created_at";

/** 모든 글(초안 포함) 최신순 */
export async function listAllPosts(): Promise<AdminPostRow[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("posts")
    .select(ADMIN_LIST_COLUMNS)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(`관리자 글 목록 조회 실패: ${error.message}`);
  return (data ?? []) as AdminPostRow[];
}

/** 단건(편집용) */
export async function getPostById(id: string): Promise<AdminPostRow | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`글 조회 실패: ${error.message}`);
  return (data as AdminPostRow) ?? null;
}

export interface PostInput {
  kind: PostKind;
  slug: string | null;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  content_json: unknown;
  content_html: string | null;
  tags: string[];
  status: "draft" | "published";
  is_public: boolean;
  entry_date: string | null;
  /** 일지 전용 구조화 데이터(주식 pnl/tickers, 운동 exercises 등). 블로그는 {} */
  data: Record<string, unknown>;
}

/** published 로 전환되는 순간 published_at 을 채운다(최초 1회). */
function resolvePublishedAt(
  status: PostInput["status"],
  current: string | null,
): string | null {
  if (status !== "published") return current; // 초안으로 내려도 기존값 유지
  return current ?? new Date().toISOString();
}

export async function createPost(input: PostInput): Promise<string> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("posts")
    .insert({
      ...input,
      published_at: resolvePublishedAt(input.status, null),
    })
    .select("id")
    .single();
  if (error) throw new Error(`글 생성 실패: ${error.message}`);
  return (data as { id: string }).id;
}

export async function updatePost(id: string, input: PostInput): Promise<void> {
  const supabase = getSupabaseAdmin();
  const existing = await getPostById(id);
  const { error } = await supabase
    .from("posts")
    .update({
      ...input,
      published_at: resolvePublishedAt(input.status, existing?.published_at ?? null),
    })
    .eq("id", id);
  if (error) throw new Error(`글 수정 실패: ${error.message}`);
}

export async function deletePost(id: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw new Error(`글 삭제 실패: ${error.message}`);
}

/** slug 중복 검사 (자기 자신 제외) */
export async function isSlugTaken(slug: string, exceptId?: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  let query = supabase.from("posts").select("id").eq("slug", slug);
  if (exceptId) query = query.neq("id", exceptId);
  const { data, error } = await query.limit(1);
  if (error) throw new Error(`slug 확인 실패: ${error.message}`);
  return (data ?? []).length > 0;
}
