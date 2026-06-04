import Link from "next/link";
import { getPublishedPosts } from "@/lib/posts";
import { PostCard } from "@/components/blog/PostCard";

// 요청 시마다 DB 조회 (Cloudflare 정적자산 캐시는 런타임 갱신 불가 → 동적 렌더링)
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const posts = await getPublishedPosts({ limit: 9 });

  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">최신 글</h1>
        <Link
          href="/blog"
          className="text-sm font-medium text-primary-600 hover:underline"
        >
          전체 보기 →
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-12 text-center text-muted">
          아직 공개된 글이 없어요.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </section>
  );
}
