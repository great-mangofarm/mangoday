import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPostBySlug } from "@/lib/posts";
import { JournalDetail } from "@/components/journal/JournalDetail";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post || post.kind !== "workout") return { title: "운동 일지를 찾을 수 없음" };
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    alternates: { canonical: `/workout/${slug}` },
  };
}

export default async function WorkoutDetailPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post || post.kind !== "workout") notFound();
  return (
    <JournalDetail post={post} kind="workout" backHref="/workout" backLabel="운동 일지" />
  );
}
