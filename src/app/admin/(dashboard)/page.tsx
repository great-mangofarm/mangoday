import Link from "next/link";
import { requireAdmin } from "@/lib/auth/dal";
import { listAllPosts } from "@/lib/admin/posts";
import { formatDateShort } from "@/lib/format";
import type { PostKind } from "@/lib/posts";

const KIND_LABEL: Record<PostKind, string> = {
  blog: "블로그",
  stock: "주식",
  workout: "운동",
};

export default async function AdminDashboardPage() {
  await requireAdmin();
  const posts = await listAllPosts();

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">글 관리</h1>
          <p className="mt-1 text-sm text-muted">
            전체 {posts.length}개 · 공개{" "}
            {posts.filter((p) => p.status === "published" && p.is_public).length}개
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/posts/new"
            className="rounded-xl bg-primary-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-600"
          >
            + 새 글
          </Link>
          <Link
            href="/admin/posts/new?kind=stock"
            className="rounded-xl border border-border px-4 py-2 text-sm font-semibold transition hover:bg-surface"
          >
            + 주식일지
          </Link>
          <Link
            href="/admin/posts/new?kind=workout"
            className="rounded-xl border border-border px-4 py-2 text-sm font-semibold transition hover:bg-surface"
          >
            + 운동일지
          </Link>
        </div>
      </div>

      {posts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-background p-12 text-center text-muted">
          아직 글이 없어요. 첫 글을 써보세요.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-background">
          <ul className="divide-y divide-border">
            {posts.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/admin/posts/${post.id}/edit`}
                  className="flex items-center gap-3 px-4 py-3 transition hover:bg-surface"
                >
                  <span className="w-12 shrink-0 text-xs font-medium text-muted">
                    {KIND_LABEL[post.kind]}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {post.title || "(제목 없음)"}
                  </span>
                  <StatusBadge status={post.status} isPublic={post.is_public} />
                  <span className="hidden w-24 shrink-0 text-right text-xs text-muted sm:inline">
                    {formatDateShort(post.updated_at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function StatusBadge({
  status,
  isPublic,
}: {
  status: "draft" | "published";
  isPublic: boolean;
}) {
  if (status === "draft") {
    return (
      <span className="shrink-0 rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">
        초안
      </span>
    );
  }
  if (!isPublic) {
    return (
      <span className="shrink-0 rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
        발행·비공개
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded-md bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
      공개
    </span>
  );
}
