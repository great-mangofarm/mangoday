import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";
import { getPublishedPosts, getTagCounts } from "@/lib/posts";
import { getPublishedJournal } from "@/lib/journal";

// 요청 시 생성 (정적자산 캐시 런타임 갱신 불가 → 동적)
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url.replace(/\/$/, "");

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/blog`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/stock`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/workout`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/calendar`, changeFrequency: "weekly", priority: 0.5 },
  ];

  const [posts, tags, stock, workout] = await Promise.all([
    getPublishedPosts({ kind: "blog" }),
    getTagCounts(),
    getPublishedJournal("stock"),
    getPublishedJournal("workout"),
  ]);

  const postRoutes: MetadataRoute.Sitemap = posts
    .filter((post) => post.slug)
    .map((post) => ({
      url: `${base}/blog/${post.slug}`,
      lastModified: post.published_at ? new Date(post.published_at) : undefined,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  const journalRoutes: MetadataRoute.Sitemap = [
    ...stock.map((p) => ({ url: `${base}/stock/${p.slug}`, priority: 0.5 })),
    ...workout.map((p) => ({ url: `${base}/workout/${p.slug}`, priority: 0.5 })),
  ].filter((r) => r.url.split("/").pop());

  const tagRoutes: MetadataRoute.Sitemap = tags.map(({ tag }) => ({
    url: `${base}/tags/${encodeURIComponent(tag)}`,
    changeFrequency: "weekly",
    priority: 0.4,
  }));

  return [...staticRoutes, ...postRoutes, ...journalRoutes, ...tagRoutes];
}
