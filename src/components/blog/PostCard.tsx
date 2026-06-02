import Link from "next/link";
import type { PostListItem } from "@/lib/posts";
import { formatDate } from "@/lib/format";
import { TagBadge } from "./TagBadge";

const KIND_PATH: Record<PostListItem["kind"], string> = {
  blog: "/blog",
  stock: "/stock",
  workout: "/workout",
};

function postHref(post: PostListItem): string {
  if (post.kind === "blog" && post.slug) return `/blog/${post.slug}`;
  return `${KIND_PATH[post.kind]}/${post.slug ?? post.id}`;
}

export function PostCard({ post }: { post: PostListItem }) {
  const href = postHref(post);
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border bg-background transition-shadow hover:shadow-md">
      {post.cover_image_url && (
        <Link href={href} className="block aspect-[16/9] overflow-hidden bg-surface">
          {/* 외부/스토리지 이미지 — next/image 최적화는 Phase 3에서 도메인 설정 후 적용 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.cover_image_url}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </Link>
      )}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="font-medium text-primary-600">
            {post.kind === "blog"
              ? "블로그"
              : post.kind === "stock"
                ? "주식일지"
                : "운동일지"}
          </span>
          <span>·</span>
          <time>{formatDate(post.published_at ?? post.entry_date)}</time>
        </div>

        <Link href={href}>
          <h3 className="text-lg font-semibold leading-snug transition-colors group-hover:text-primary-700">
            {post.title}
          </h3>
        </Link>

        {post.excerpt && (
          <p className="line-clamp-2 text-sm text-muted">{post.excerpt}</p>
        )}

        {post.tags?.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
            {post.tags.slice(0, 4).map((tag) => (
              <TagBadge key={tag} tag={tag} />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
