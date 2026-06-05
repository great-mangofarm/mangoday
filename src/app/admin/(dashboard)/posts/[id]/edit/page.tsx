import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/dal";
import { getPostById } from "@/lib/admin/posts";
import { PostEditorLoader } from "@/components/admin/PostEditorLoader";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) notFound();

  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin" className="text-sm text-muted hover:underline">
        ← 목록
      </Link>
      <PostEditorLoader
        initial={{
          id: post.id,
          kind: post.kind,
          title: post.title,
          slug: post.slug ?? "",
          excerpt: post.excerpt ?? "",
          coverImageUrl: post.cover_image_url ?? "",
          tags: post.tags ?? [],
          status: post.status,
          isPublic: post.is_public,
          entryDate: post.entry_date,
          contentJson: post.content_json,
          data: (post.data ?? {}) as Record<string, unknown>,
        }}
      />
    </div>
  );
}
