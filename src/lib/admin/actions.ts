"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/dal";
import {
  createPost,
  updatePost,
  deletePost,
  isSlugTaken,
  type PostInput,
} from "@/lib/admin/posts";
import type { PostKind } from "@/lib/posts";
import { slugify } from "@/lib/slug";

export interface SavePostPayload {
  id?: string;
  kind: PostKind;
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl: string;
  tags: string[];
  status: "draft" | "published";
  isPublic: boolean;
  entryDate: string | null;
  contentJson: unknown;
  contentHtml: string;
}

export interface SaveResult {
  ok: boolean;
  id?: string;
  error?: string;
}

function revalidatePublic() {
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath("/blog/[slug]", "page");
  revalidatePath("/tags/[tag]", "page");
  revalidatePath("/sitemap.xml");
}

export async function savePost(payload: SavePostPayload): Promise<SaveResult> {
  await requireAdmin();

  const title = payload.title.trim();
  if (!title) return { ok: false, error: "제목을 입력해 주세요." };

  // slug: 입력값 우선, 없으면 제목에서 생성
  const slug = (payload.slug.trim() ? slugify(payload.slug) : slugify(title)) || null;
  if (!slug) {
    return { ok: false, error: "slug 를 만들 수 없어요. 영문/숫자가 포함된 slug 를 입력해 주세요." };
  }

  if (await isSlugTaken(slug, payload.id)) {
    return { ok: false, error: `slug "${slug}" 는 이미 사용 중이에요. 다른 값을 입력해 주세요.` };
  }

  const input: PostInput = {
    kind: payload.kind,
    slug,
    title,
    excerpt: payload.excerpt.trim() || null,
    cover_image_url: payload.coverImageUrl.trim() || null,
    content_json: payload.contentJson ?? null,
    content_html: payload.contentHtml || null,
    tags: payload.tags.map((t) => t.trim()).filter(Boolean),
    status: payload.status,
    is_public: payload.isPublic,
    entry_date: payload.entryDate,
  };

  try {
    if (payload.id) {
      await updatePost(payload.id, input);
      revalidatePublic();
      revalidatePath("/admin");
      return { ok: true, id: payload.id };
    }
    const id = await createPost(input);
    revalidatePublic();
    revalidatePath("/admin");
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "저장 중 오류가 발생했어요." };
  }
}

export async function removePost(id: string): Promise<SaveResult> {
  await requireAdmin();
  try {
    await deletePost(id);
    revalidatePublic();
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "삭제 중 오류가 발생했어요." };
  }
}
