import Link from "next/link";
import { formatDate } from "@/lib/format";
import { TagBadge } from "@/components/blog/TagBadge";
import { Comments } from "@/components/comments/Comments";
import { JournalStructured } from "@/components/journal/JournalStructured";
import type { Post } from "@/lib/posts";

export function JournalDetail({
  post,
  kind,
  backHref,
  backLabel,
}: {
  post: Post;
  kind: "stock" | "workout";
  backHref: string;
  backLabel: string;
}) {
  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-6">
      <nav className="text-sm text-muted">
        <Link href={backHref} className="hover:text-primary-600">
          ← {backLabel}
        </Link>
      </nav>

      <header className="flex flex-col gap-3">
        <time className="text-sm text-muted">
          {formatDate(post.entry_date ?? post.published_at)}
        </time>
        <h1 className="text-3xl font-bold leading-tight tracking-tight">
          {post.title}
        </h1>
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <TagBadge key={tag} tag={tag} />
            ))}
          </div>
        )}
      </header>

      <JournalStructured kind={kind} data={post.data} />

      {post.cover_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.cover_image_url}
          alt={post.title}
          className="w-full rounded-xl border border-border object-cover"
        />
      )}

      {post.content_html && (
        <div
          className="prose-content"
          dangerouslySetInnerHTML={{ __html: post.content_html }}
        />
      )}

      <Comments postId={post.id} path={`/${kind}/${post.slug}`} />
    </article>
  );
}
