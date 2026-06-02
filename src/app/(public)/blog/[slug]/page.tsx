import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug, getPublishedSlugs } from "@/lib/posts";
import { formatDate } from "@/lib/format";
import { TagBadge } from "@/components/blog/TagBadge";

export const revalidate = 60;
// 빌드 시 알려진 slug 외에도 런타임에 첫 방문 시 생성(ISR)
export const dynamicParams = true;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await getPublishedSlugs("blog");
  return slugs.map((slug) => ({ slug }));
}

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
    </article>
  );
}
