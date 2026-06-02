import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedPosts, getTagCounts } from "@/lib/posts";
import { PostCard } from "@/components/blog/PostCard";

export const revalidate = 60;
export const dynamicParams = true;

type Props = {
  params: Promise<{ tag: string }>;
};

export async function generateStaticParams() {
  const tags = await getTagCounts();
  return tags.map(({ tag }) => ({ tag: encodeURIComponent(tag) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  return {
    title: `#${decoded}`,
    description: `'${decoded}' 태그가 달린 글 모음`,
    alternates: { canonical: `/tags/${tag}` },
  };
}

export default async function TagPage({ params }: Props) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  const posts = await getPublishedPosts({ tag: decoded });

  return (
    <div className="flex flex-col gap-8">
      <header>
        <nav className="mb-2 text-sm text-muted">
          <Link href="/blog" className="hover:text-primary-600">
            ← 블로그
          </Link>
        </nav>
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="text-primary-600">#{decoded}</span>
        </h1>
        <p className="mt-1 text-muted">{posts.length}개의 글</p>
      </header>

      {posts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-10 text-center text-muted">
          이 태그가 달린 공개 글이 없어요.
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
