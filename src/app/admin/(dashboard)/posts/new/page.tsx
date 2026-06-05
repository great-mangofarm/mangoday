import Link from "next/link";
import { requireAdmin } from "@/lib/auth/dal";
import { PostEditorLoader } from "@/components/admin/PostEditorLoader";
import type { PostKind } from "@/lib/posts";

const KINDS: PostKind[] = ["blog", "stock", "workout"];

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  await requireAdmin();
  const { kind: rawKind } = await searchParams;
  const kind = (KINDS as string[]).includes(rawKind ?? "")
    ? (rawKind as PostKind)
    : "blog";

  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin" className="text-sm text-muted hover:underline">
        ← 목록
      </Link>
      <PostEditorLoader
        initial={{
          kind,
          title: "",
          slug: "",
          excerpt: "",
          coverImageUrl: "",
          tags: [],
          status: "draft",
          isPublic: false,
          entryDate: null,
          contentJson: null,
          data: {},
        }}
      />
    </div>
  );
}
