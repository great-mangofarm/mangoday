"use client";

import { useEffect, useState } from "react";
import { BODY_PARTS } from "@/lib/exercise-translit";

export interface PickedExercise {
  id: string;
  name: string;
  gifUrl: string;
}
interface ApiExercise extends PickedExercise {
  original: string;
  bodyParts: string[];
}

export function ExercisePicker({
  onSelect,
}: {
  onSelect: (e: PickedExercise) => void;
}) {
  const [tab, setTab] = useState(BODY_PARTS[0].api);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<ApiExercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const run = () => {
      const q = query.trim();
      const url = q
        ? `/api/exercises?name=${encodeURIComponent(q)}`
        : `/api/exercises?bodyParts=${encodeURIComponent(tab)}`;
      Promise.resolve().then(() => active && setLoading(true));
      fetch(url)
        .then((r) => r.json())
        .then((d) => {
          if (active) {
            setItems(d.exercises ?? []);
            setLoading(false);
          }
        })
        .catch(() => active && setLoading(false));
    };
    const t = setTimeout(run, query ? 300 : 0);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [tab, query]);

  return (
    <div className="flex flex-col gap-3">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="운동 검색 (영어: bench, squat…)"
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
      />

      {!query && (
        <div className="flex flex-wrap gap-1.5">
          {BODY_PARTS.map((bp) => (
            <button
              key={bp.api}
              type="button"
              onClick={() => setTab(bp.api)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                tab === bp.api
                  ? "bg-primary-500 text-white"
                  : "border border-border text-muted hover:bg-surface"
              }`}
            >
              {bp.ko}
            </button>
          ))}
        </div>
      )}

      <div className="max-h-72 overflow-y-auto rounded-lg border border-border">
        {loading ? (
          <p className="p-6 text-center text-sm text-muted">불러오는 중…</p>
        ) : items.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted">결과가 없어요.</p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((ex) => (
              <li key={ex.id}>
                <button
                  type="button"
                  onClick={() => onSelect({ id: ex.id, name: ex.name, gifUrl: ex.gifUrl })}
                  className="flex w-full items-center gap-3 p-2 text-left transition hover:bg-surface"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ex.gifUrl}
                    alt={ex.name}
                    loading="lazy"
                    className="h-12 w-12 shrink-0 rounded-md border border-border bg-white object-cover"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{ex.name}</span>
                    <span className="block truncate text-xs text-muted">{ex.original}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
