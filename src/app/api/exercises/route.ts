import { NextResponse, type NextRequest } from "next/server";
import { translitExercise } from "@/lib/exercise-translit";

/**
 * GET /api/exercises?bodyParts=chest&name=bench
 * oss.exercisedb.dev(무료, 키 불필요) 프록시 + 한글 음차.
 * CORS 회피 + 안정성. 운동 선택기에서 사용.
 */
const BASE = "https://oss.exercisedb.dev/api/v1/exercises";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const params = new URLSearchParams({ limit: "40" });
  const bodyParts = sp.get("bodyParts");
  const name = sp.get("name");
  if (bodyParts) params.set("bodyParts", bodyParts);
  if (name) params.set("name", name);

  try {
    const res = await fetch(`${BASE}?${params.toString()}`, {
      headers: { "User-Agent": "mangoday" },
    });
    if (!res.ok) return NextResponse.json({ exercises: [] });
    const json = (await res.json()) as {
      data?: { exerciseId: string; name: string; gifUrl: string; bodyParts?: string[] }[];
    };
    const exercises = (json.data ?? []).map((e) => ({
      id: e.exerciseId,
      name: translitExercise(e.name),
      original: e.name,
      gifUrl: e.gifUrl,
      bodyParts: e.bodyParts ?? [],
    }));
    return NextResponse.json({ exercises });
  } catch {
    return NextResponse.json({ exercises: [] });
  }
}
