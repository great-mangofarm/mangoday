import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug } from "@/lib/posts";
import { formatDate } from "@/lib/format";
import { TagBadge } from "@/components/blog/TagBadge";
import { Comments } from "@/components/comments/Comments";

// 요청 시마다 DB 조회 (정적자산 캐시 런타임 갱신 불가 → 동적 렌더링)
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "글을 찾을 수 없음" };

  const description = post.excerpt ?? undefined;
  return {
    title: post.title,
    description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description,
      url: `/blog/${slug}`,
      publishedTime: post.published_at ?? undefined,
      images: post.cover_image_url ? [{ url: post.cover_image_url }] : undefined,
      tags: post.tags,
    },
    twitter: {
      card: post.cover_image_url ? "summary_large_image" : "summary",
      title: post.title,
      description,
      images: post.cover_image_url ? [post.cover_image_url] : undefined,
    },
  };
}

export default async function BlogDetailPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-6">
      <nav className="text-sm text-muted">
        <Link href="/blog" className="hover:text-primary-600">
          ← 블로그
        </Link>
      </nav>

      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold leading-tight tracking-tight">
          {post.title}
        </h1>
        <time className="text-sm text-muted">
          {formatDate(post.published_at ?? post.entry_date)}
        </time>
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <TagBadge key={tag} tag={tag} />
            ))}
          </div>
        )}
      </header>

      {post.cover_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.cover_image_url}
          alt={post.title}
          className="w-full rounded-xl border border-border object-cover"
        />
      )}

      {post.content_html ? (
        <div
          className="prose-content"
          dangerouslySetInnerHTML={{ __html: post.content_html }}
        />
      ) : (
        <p className="text-muted">본문이 없습니다.</p>
      )}

      <Comments postId={post.id} path={`/blog/${slug}`} />
    </article>
  );
}
