import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";
import { getPublishedPosts, getTagCounts } from "@/lib/posts";

// 요청 시 생성 (정적자산 캐시 런타임 갱신 불가 → 동적)
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url.replace(/\/$/, "");

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/blog`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/calendar`, changeFrequency: "weekly", priority: 0.5 },
  ];

  const [posts, tags] = await Promise.all([
    getPublishedPosts({ kind: "blog" }),
    getTagCounts(),
  ]);

  const postRoutes: MetadataRoute.Sitemap = posts
    .filter((post) => post.slug)
    .map((post) => ({
      url: `${base}/blog/${post.slug}`,
      lastModified: post.published_at ? new Date(post.published_at) : undefined,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  const tagRoutes: MetadataRoute.Sitemap = tags.map(({ tag }) => ({
    url: `${base}/tags/${encodeURIComponent(tag)}`,
    changeFrequency: "weekly",
    priority: 0.4,
  }));

  return [...staticRoutes, ...postRoutes, ...tagRoutes];
}
