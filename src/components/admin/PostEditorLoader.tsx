"use client";

import dynamic from "next/dynamic";
import type { EditorInitial } from "./PostEditor";

// BlockNote 는 SSR 안전하지 않음(window 참조) → 클라이언트에서만 로드
const PostEditor = dynamic(
  () => import("./PostEditor").then((m) => m.PostEditor),
  {
    ssr: false,
    loading: () => (
      <p className="py-10 text-center text-sm text-muted">에디터 불러오는 중…</p>
    ),
  },
);

export function PostEditorLoader({ initial }: { initial: EditorInitial }) {
  return <PostEditor initial={initial} />;
}
