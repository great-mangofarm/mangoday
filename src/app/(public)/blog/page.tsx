import type { Metadata } from "next";
import { getPublishedPosts, getTagCounts } from "@/lib/posts";
import { PostCard } from "@/components/blog/PostCard";
import { TagBadge } from "@/components/blog/TagBadge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "블로그",
  description: "mangoday의 블로그 글 모음",
};

export default async function BlogListPage() {
  const [posts, tags] = await Promise.all([
    getPublishedPosts({ kind: "blog" }),
    getTagCounts(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">블로그</h1>
        <p className="mt-1 text-muted">{posts.length}개의 글</p>
      </header>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map(({ tag, count }) => (
            <TagBadge key={tag} tag={tag} count={count} />
          ))}
        </div>
      )}

      {posts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-10 text-center text-muted">
          아직 공개된 글이 없어요.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
