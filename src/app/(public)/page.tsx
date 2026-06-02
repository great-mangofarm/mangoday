import Link from "next/link";
import { getPublishedPosts } from "@/lib/posts";
import { PostCard } from "@/components/blog/PostCard";

// ISR: 60초마다 재생성 (cacheComponents 미사용 — 기존 모델)
export const revalidate = 60;

export default async function HomePage() {
  const posts = await getPublishedPosts({ limit: 6 });

  return (
    <div className="flex flex-col gap-10">
      {/* 히어로 */}
      <section className="rounded-2xl border border-primary-200 bg-gradient-to-br from-primary-50 to-background p-8 sm:p-12">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          기록하는 즐거움, <span className="text-primary-600">mangoday</span>
        </h1>
        <p className="mt-3 max-w-xl text-muted">
          블로그 글, 주식·운동 일지, 그리고 일정까지. 한 곳에 차곡차곡 쌓아두는 개인 공간.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/blog"
            className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
          >
            블로그 보기
          </Link>
          <Link
            href="/calendar"
            className="rounded-lg border border-border px-4 py-2 text-sm font-semibold transition-colors hover:bg-surface"
          >
            캘린더
          </Link>
        </div>
      </section>

      {/* 최신 글 */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">최신 글</h2>
          <Link href="/blog" className="text-sm font-medium text-primary-600 hover:underline">
            전체 보기 →
          </Link>
        </div>

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
      </section>
    </div>
  );
}
