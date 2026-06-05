"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { savePost, removePost } from "@/lib/admin/actions";
import { slugify } from "@/lib/slug";
import type { PostKind } from "@/lib/posts";
import type { WorkoutExercise } from "@/lib/journal";

/** 파일을 관리자 업로드 API 로 보내 공개 URL 을 받는다. */
async function uploadToStorage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "이미지 업로드에 실패했어요.");
  }
  const { url } = (await res.json()) as { url: string };
  return url;
}

export interface EditorInitial {
  id?: string;
  kind: PostKind;
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl: string;
  tags: string[];
  status: "draft" | "published";
  isPublic: boolean;
  entryDate: string | null;
  contentJson: unknown;
  data: Record<string, unknown>;
}

export function PostEditor({ initial }: { initial: EditorInitial }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(initial.title);
  const [slug, setSlug] = useState(initial.slug);
  const [slugEdited, setSlugEdited] = useState(Boolean(initial.slug));
  const [kind, setKind] = useState<PostKind>(initial.kind);
  const [excerpt, setExcerpt] = useState(initial.excerpt);
  const [coverImageUrl, setCoverImageUrl] = useState(initial.coverImageUrl);
  const [tagsText, setTagsText] = useState(initial.tags.join(", "));
  const [status, setStatus] = useState<"draft" | "published">(initial.status);
  const [isPublic, setIsPublic] = useState(initial.isPublic);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 일지 전용 상태
  const initData = (initial.data ?? {}) as {
    pnl?: number;
    tickers?: string[];
    exercises?: WorkoutExercise[];
  };
  const [entryDate, setEntryDate] = useState(initial.entryDate ?? "");
  const [stockPnl, setStockPnl] = useState(
    initData.pnl != null ? String(initData.pnl) : "",
  );
  const [stockTickers, setStockTickers] = useState(
    (initData.tickers ?? []).join(", "),
  );
  const [exercises, setExercises] = useState<WorkoutExercise[]>(
    initData.exercises ?? [],
  );

  const coverInputRef = useRef<HTMLInputElement>(null);
  const [coverUploading, setCoverUploading] = useState(false);

  const editor = useCreateBlockNote({
    initialContent:
      Array.isArray(initial.contentJson) && initial.contentJson.length > 0
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (initial.contentJson as any)
        : undefined,
    uploadFile: uploadToStorage,
  });

  async function handleCoverFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setCoverUploading(true);
    try {
      const url = await uploadToStorage(file);
      setCoverImageUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "커버 업로드 실패");
    } finally {
      setCoverUploading(false);
    }
  }

  function onTitleChange(value: string) {
    setTitle(value);
    if (!slugEdited) setSlug(slugify(value));
  }

  async function handleSave() {
    setError(null);
    setMessage(null);
    const html = await editor.blocksToHTMLLossy(editor.document);

    let data: Record<string, unknown> = {};
    if (kind === "stock") {
      data = {
        pnl: stockPnl.trim() ? Number(stockPnl) : 0,
        tickers: stockTickers.split(",").map((t) => t.trim()).filter(Boolean),
      };
    } else if (kind === "workout") {
      data = {
        exercises: exercises
          .map((e) => ({
            name: e.name.trim(),
            sets: e.sets.map((s) => ({
              weight: Number(s.weight) || 0,
              reps: Number(s.reps) || 0,
            })),
          }))
          .filter((e) => e.name),
      };
    }

    const payload = {
      id: initial.id,
      kind,
      title,
      slug,
      excerpt,
      coverImageUrl,
      tags: tagsText.split(",").map((t) => t.trim()).filter(Boolean),
      status,
      isPublic,
      entryDate: kind === "blog" ? null : entryDate || null,
      contentJson: editor.document,
      contentHtml: html,
      data,
    };
    startTransition(async () => {
      const res = await savePost(payload);
      if (!res.ok) {
        setError(res.error ?? "저장 실패");
        return;
      }
      setMessage("저장됐어요.");
      if (!initial.id && res.id) {
        router.replace(`/admin/posts/${res.id}/edit`);
      } else {
        router.refresh();
      }
    });
  }

  function handleDelete() {
    if (!initial.id) return;
    if (!window.confirm("이 글을 삭제할까요? 되돌릴 수 없어요.")) return;
    startTransition(async () => {
      const res = await removePost(initial.id!);
      if (!res.ok) {
        setError(res.error ?? "삭제 실패");
        return;
      }
      router.push("/admin");
    });
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* 본문 영역 */}
      <div className="min-w-0 flex-1">
        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="제목을 입력하세요"
          className="w-full border-0 bg-transparent text-3xl font-bold outline-none placeholder:text-zinc-300"
        />
        <div className="mt-4 rounded-xl border border-border bg-background py-2">
          <BlockNoteView editor={editor} theme="light" />
        </div>
      </div>

      {/* 설정 사이드바 */}
      <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-72">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="flex-1 rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-600 disabled:opacity-50"
          >
            {isPending ? "저장 중…" : "저장"}
          </button>
          {initial.id && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="rounded-xl border border-red-200 px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            >
              삭제
            </button>
          )}
        </div>

        {message && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            {message}
          </p>
        )}
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <Field label="종류">
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as PostKind)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="blog">블로그</option>
            <option value="stock">주식 일지</option>
            <option value="workout">운동 일지</option>
          </select>
        </Field>

        {kind !== "blog" && (
          <Field label="일지 날짜">
            <input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </Field>
        )}

        {kind === "stock" && (
          <>
            <Field label="실현 손익 (원)">
              <input
                type="number"
                value={stockPnl}
                onChange={(e) => setStockPnl(e.target.value)}
                placeholder="예: 120000 또는 -50000"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </Field>
            <Field label="종목 (쉼표로 구분)">
              <input
                value={stockTickers}
                onChange={(e) => setStockTickers(e.target.value)}
                placeholder="삼성전자, TSLA"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </Field>
          </>
        )}

        {kind === "workout" && (
          <WorkoutFields exercises={exercises} setExercises={setExercises} />
        )}

        <Field label="상태">
          <div className="flex gap-2">
            {(["draft", "published"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  status === s
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-border text-muted hover:bg-surface"
                }`}
              >
                {s === "draft" ? "초안" : "발행"}
              </button>
            ))}
          </div>
        </Field>

        <label className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5">
          <span className="text-sm font-medium">공개</span>
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="h-5 w-5 accent-primary-500"
          />
        </label>
        <p className="-mt-2 text-xs text-muted">
          발행 + 공개일 때만 사이트에 보여요.
        </p>

        <Field label="slug (주소)">
          <input
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugEdited(true);
            }}
            placeholder="hello-mangoday"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </Field>

        <Field label="태그 (쉼표로 구분)">
          <input
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            placeholder="일상, 공지"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </Field>

        <Field label="요약 (목록·SEO용)">
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={3}
            placeholder="비우면 본문에서 자동 추출 예정"
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </Field>

        <Field label="커버 이미지">
          {coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImageUrl}
              alt="커버 미리보기"
              className="mb-1 aspect-video w-full rounded-lg border border-border object-cover"
            />
          )}
          <input
            value={coverImageUrl}
            onChange={(e) => setCoverImageUrl(e.target.value)}
            placeholder="https://… 또는 아래에서 업로드"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={coverUploading}
              className="flex-1 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-surface disabled:opacity-50"
            >
              {coverUploading ? "업로드 중…" : "이미지 업로드"}
            </button>
            {coverImageUrl && (
              <button
                type="button"
                onClick={() => setCoverImageUrl("")}
                className="rounded-lg border border-border px-3 py-2 text-sm text-muted hover:bg-surface"
              >
                제거
              </button>
            )}
          </div>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverFile}
            className="hidden"
          />
        </Field>
      </aside>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-muted">{label}</span>
      {children}
    </div>
  );
}

function WorkoutFields({
  exercises,
  setExercises,
}: {
  exercises: WorkoutExercise[];
  setExercises: (next: WorkoutExercise[]) => void;
}) {
  const volume = exercises.reduce(
    (sum, e) =>
      sum +
      e.sets.reduce((s, set) => s + (Number(set.weight) || 0) * (Number(set.reps) || 0), 0),
    0,
  );

  const update = (next: WorkoutExercise[]) => setExercises(next);
  const addExercise = () =>
    update([...exercises, { name: "", sets: [{ weight: 0, reps: 0 }] }]);
  const removeExercise = (i: number) =>
    update(exercises.filter((_, idx) => idx !== i));
  const setName = (i: number, name: string) =>
    update(exercises.map((e, idx) => (idx === i ? { ...e, name } : e)));
  const addSet = (i: number) =>
    update(
      exercises.map((e, idx) =>
        idx === i ? { ...e, sets: [...e.sets, { weight: 0, reps: 0 }] } : e,
      ),
    );
  const removeSet = (i: number, j: number) =>
    update(
      exercises.map((e, idx) =>
        idx === i ? { ...e, sets: e.sets.filter((_, k) => k !== j) } : e,
      ),
    );
  const setField = (
    i: number,
    j: number,
    field: "weight" | "reps",
    value: number,
  ) =>
    update(
      exercises.map((e, idx) =>
        idx === i
          ? {
              ...e,
              sets: e.sets.map((s, k) => (k === j ? { ...s, [field]: value } : s)),
            }
          : e,
      ),
    );

  return (
    <Field label={`운동 (총 볼륨 ${volume.toLocaleString("ko-KR")}kg)`}>
      <div className="flex flex-col gap-3">
        {exercises.map((ex, i) => (
          <div key={i} className="rounded-lg border border-border p-2.5">
            <div className="flex gap-2">
              <input
                value={ex.name}
                onChange={(e) => setName(i, e.target.value)}
                placeholder="운동명 (예: 벤치프레스)"
                className="min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              />
              <button
                type="button"
                onClick={() => removeExercise(i)}
                className="shrink-0 rounded-md px-2 text-xs text-muted hover:text-red-600"
              >
                삭제
              </button>
            </div>
            <div className="mt-2 flex flex-col gap-1.5">
              {ex.sets.map((set, j) => (
                <div key={j} className="flex items-center gap-1.5 text-sm">
                  <span className="w-8 text-xs text-muted">{j + 1}세트</span>
                  <input
                    type="number"
                    value={set.weight || ""}
                    onChange={(e) => setField(i, j, "weight", Number(e.target.value))}
                    placeholder="kg"
                    className="w-16 rounded-md border border-border bg-background px-2 py-1"
                  />
                  <span className="text-xs text-muted">kg ×</span>
                  <input
                    type="number"
                    value={set.reps || ""}
                    onChange={(e) => setField(i, j, "reps", Number(e.target.value))}
                    placeholder="회"
                    className="w-14 rounded-md border border-border bg-background px-2 py-1"
                  />
                  <span className="text-xs text-muted">회</span>
                  {ex.sets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSet(i, j)}
                      className="ml-auto text-xs text-muted hover:text-red-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addSet(i)}
                className="self-start text-xs font-medium text-primary-600 hover:underline"
              >
                + 세트 추가
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addExercise}
          className="rounded-lg border border-dashed border-border py-2 text-sm font-medium text-muted hover:bg-surface"
        >
          + 운동 추가
        </button>
      </div>
    </Field>
  );
}
