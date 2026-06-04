import { getSupabaseAnon, getSupabaseAdmin } from "@/lib/supabase";

/**
 * 댓글 데이터 계층.
 * - 읽기: anon 키 + RLS(visible 만). 공개 글의 댓글 누구나 조회.
 * - 쓰기/삭제: service role (서버에서 세션 검증 후).
 */

export interface CommentRow {
  id: string;
  post_id: string;
  parent_id: string | null;
  author_name: string;
  author_provider: string;
  author_key: string;
  author_image: string | null;
  content: string;
  status: "visible" | "hidden";
  created_at: string;
}

export async function getVisibleComments(postId: string): Promise<CommentRow[]> {
  const sb = getSupabaseAnon();
  const { data, error } = await sb
    .from("comments")
    .select("*")
    .eq("post_id", postId)
    .eq("status", "visible")
    .order("created_at", { ascending: true });
  if (error) throw new Error(`댓글 조회 실패: ${error.message}`);
  return (data ?? []) as CommentRow[];
}

/** 공개(발행+공개)된 글인지 확인 — 비공개 글엔 댓글 못 달게 */
export async function isPostCommentable(postId: string): Promise<boolean> {
  const sb = getSupabaseAnon();
  const { data, error } = await sb
    .from("posts")
    .select("id")
    .eq("id", postId)
    .eq("status", "published")
    .eq("is_public", true)
    .maybeSingle();
  if (error) throw new Error(`글 확인 실패: ${error.message}`);
  return !!data;
}

export interface InsertCommentInput {
  postId: string;
  authorName: string;
  authorProvider: string;
  authorKey: string;
  authorImage: string | null;
  content: string;
}

export async function insertComment(
  input: InsertCommentInput,
): Promise<CommentRow> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("comments")
    .insert({
      post_id: input.postId,
      author_name: input.authorName,
      author_provider: input.authorProvider,
      author_key: input.authorKey,
      author_image: input.authorImage,
      content: input.content,
    })
    .select("*")
    .single();
  if (error) throw new Error(`댓글 작성 실패: ${error.message}`);
  return data as CommentRow;
}

/** 권한 검사용 — 댓글 작성자 키 조회 */
export async function getCommentAuthorKey(id: string): Promise<string | null> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("comments")
    .select("author_key")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`댓글 확인 실패: ${error.message}`);
  return (data as { author_key: string } | null)?.author_key ?? null;
}

export async function deleteCommentRow(id: string): Promise<void> {
  const sb = getSupabaseAdmin();
  const { error } = await sb.from("comments").delete().eq("id", id);
  if (error) throw new Error(`댓글 삭제 실패: ${error.message}`);
}
