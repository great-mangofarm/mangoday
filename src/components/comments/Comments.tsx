"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { createComment, deleteComment } from "@/lib/comments-actions";
import { formatDateShort } from "@/lib/format";

interface CommentItem {
  id: string;
  name: string;
  image: string | null;
  provider: string;
  content: string;
  createdAt: string;
  mine: boolean;
}
interface Viewer {
  loggedIn: boolean;
  name: string | null;
  picture: string | null;
  isAdmin: boolean;
  providers: string[];
}

const PROVIDER_LABEL: Record<string, string> = {
  google: "Google",
  kakao: "카카오",
  naver: "네이버",
};
const LOGIN_STYLE: Record<string, string> = {
  google: "border border-border bg-white text-foreground hover:bg-surface",
  kakao: "bg-[#FEE500] text-[#191600] hover:brightness-95",
  naver: "bg-[#03C75A] text-white hover:brightness-95",
};

export function Comments({ postId, path }: { postId: string; path: string }) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const next = path;

  const load = useCallback(async () => {
    const res = await fetch(`/api/comments?postId=${postId}`, { cache: "no-store" });
    const data = await res.json();
    setComments(data.comments ?? []);
    setViewer(data.viewer ?? null);
    setLoading(false);
  }, [postId]);

  useEffect(() => {
    let active = true;
    fetch(`/api/comments?postId=${postId}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        setComments(data.comments ?? []);
        setViewer(data.viewer ?? null);
        setLoading(false);
      })
      .catch(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [postId]);

  function handleSubmit() {
    setError(null);
    const text = content.trim();
    if (!text) return;
    startTransition(async () => {
      const res = await createComment(postId, text);
      if (!res.ok) {
        setError(res.error ?? "작성 실패");
        return;
      }
      setContent("");
      await load();
    });
  }

  function handleDelete(id: string) {
    if (!window.confirm("이 댓글을 삭제할까요?")) return;
    startTransition(async () => {
      const res = await deleteComment(id);
      if (!res.ok) {
        setError(res.error ?? "삭제 실패");
        return;
      }
      await load();
    });
  }

  return (
    <section className="mt-12 border-t border-border pt-8">
      <h2 className="text-lg font-bold">
        댓글 {comments.length > 0 && <span className="text-primary-600">{comments.length}</span>}
      </h2>

      {/* 작성 영역 */}
      <div className="mt-4">
        {viewer?.loggedIn ? (
          <div className="flex flex-col gap-2">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              placeholder={`${viewer.name || "익명"} 님으로 댓글 남기기`}
              className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary-400"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={handleSubmit}
                disabled={isPending || !content.trim()}
                className="rounded-xl bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:opacity-50"
              >
                {isPending ? "등록 중…" : "등록"}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="mb-3 text-sm text-muted">댓글을 남기려면 로그인하세요.</p>
            <div className="flex flex-wrap gap-2">
              {(viewer?.providers ?? []).map((p) => (
                <a
                  key={p}
                  href={`/api/auth/login?provider=${p}&next=${encodeURIComponent(next)}`}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${LOGIN_STYLE[p] ?? "border border-border"}`}
                >
                  {PROVIDER_LABEL[p] ?? p}로 로그인
                </a>
              ))}
            </div>
          </div>
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      {/* 목록 */}
      <ul className="mt-8 flex flex-col gap-5">
        {loading ? (
          <li className="text-sm text-muted">댓글을 불러오는 중…</li>
        ) : comments.length === 0 ? (
          <li className="text-sm text-muted">첫 댓글을 남겨보세요.</li>
        ) : (
          comments.map((c) => (
            <li key={c.id} className="flex gap-3">
              <Avatar name={c.name} image={c.image} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{c.name}</span>
                  <span className="text-xs text-muted">{formatDateShort(c.createdAt)}</span>
                  {(c.mine || viewer?.isAdmin) && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      disabled={isPending}
                      className="ml-auto text-xs text-muted hover:text-red-600"
                    >
                      삭제
                    </button>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm text-foreground">
                  {c.content}
                </p>
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

function Avatar({ name, image }: { name: string; image: string | null }) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name}
        referrerPolicy="no-referrer"
        className="h-9 w-9 shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
      {name.slice(0, 1) || "?"}
    </div>
  );
}
