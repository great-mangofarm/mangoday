import { getSupabaseAnon } from "./supabase";

/**
 * 공개 글 조회 헬퍼 (anon 키 + RLS).
 * RLS 정책상 status='published' AND is_public=true 인 글만 읽힌다.
 * 추가로 쿼리에도 명시해 의도를 분명히 한다.
 */

export type PostKind = "blog" | "stock" | "workout";

export interface PostListItem {
  id: string;
  kind: PostKind;
  slug: string | null;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  tags: string[];
  entry_date: string | null;
  published_at: string | null;
}

export interface Post extends PostListItem {
  content_html: string | null;
  content_json: unknown;
  data: Record<string, unknown>;
}

const LIST_COLUMNS =
  "id, kind, slug, title, excerpt, cover_image_url, tags, entry_date, published_at";

export interface ListOptions {
  kind?: PostKind;
  tag?: string;
  limit?: number;
}

export async function getPublishedPosts(
  opts: ListOptions = {},
): Promise<PostListItem[]> {
  const supabase = getSupabaseAnon();
  let query = supabase
    .from("posts")
    .select(LIST_COLUMNS)
    .eq("status", "published")
    .eq("is_public", true)
    .order("published_at", { ascending: false, nullsFirst: false });

  if (opts.kind) query = query.eq("kind", opts.kind);
  if (opts.tag) query = query.contains("tags", [opts.tag.normalize("NFC")]);
  if (opts.limit) query = query.limit(opts.limit);

  const { data, error } = await query;
  if (error) throw new Error(`글 목록 조회 실패: ${error.message}`);
  return (data ?? []) as PostListItem[];
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const supabase = getSupabaseAnon();
  // 한글 슬러그가 URL을 거치며 NFD(분해형)로 올 수 있어 NFC로 정규화해 매칭
  const normalized = slug.normalize("NFC");
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", normalized)
    .eq("status", "published")
    .eq("is_public", true)
    .maybeSingle();

  if (error) throw new Error(`글 조회 실패: ${error.message}`);
  return (data as Post) ?? null;
}

/** ISR 사전 생성용 — 공개 블로그 글의 slug 목록 */
export async function getPublishedSlugs(kind: PostKind = "blog"): Promise<string[]> {
  const supabase = getSupabaseAnon();
  const { data, error } = await supabase
    .from("posts")
    .select("slug")
    .eq("kind", kind)
    .eq("status", "published")
    .eq("is_public", true)
    .not("slug", "is", null);

  if (error) throw new Error(`slug 목록 조회 실패: ${error.message}`);
  return (data ?? [])
    .map((row) => (row as { slug: string | null }).slug)
    .filter((slug): slug is string => Boolean(slug));
}

export interface TagCount {
  tag: string;
  count: number;
}

/** 공개 글에서 태그 집계 (검색/태그클라우드용) */
export async function getTagCounts(): Promise<TagCount[]> {
  const posts = await getPublishedPosts();
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}
