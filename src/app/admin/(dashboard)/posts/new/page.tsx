import Link from "next/link";
import { requireAdmin } from "@/lib/auth/dal";
import { PostEditor } from "@/components/admin/PostEditor";

export default async function NewPostPage() {
  await requireAdmin();
  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin" className="text-sm text-muted hover:underline">
        ← 목록
      </Link>
      <PostEditor
        initial={{
          kind: "blog",
          title: "",
          slug: "",
          excerpt: "",
          coverImageUrl: "",
          tags: [],
          status: "draft",
          isPublic: false,
          entryDate: null,
          contentJson: null,
        }}
      />
    </div>
  );
}
