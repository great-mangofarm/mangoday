import { NextResponse, type NextRequest } from "next/server";
import { getProvider, isProvider } from "@/lib/auth/providers";
import {
  OAUTH_STATE_COOKIE,
  OAUTH_NEXT_COOKIE,
  isProd,
} from "@/lib/auth/session";
import { getBaseUrl, callbackPath, safeNext } from "@/lib/auth/url";

/**
 * GET /api/auth/login?provider=google|kakao|naver&next=/blog/xxx
 * 해당 프로바이더 로그인으로 리다이렉트. state(CSRF) + next(복귀경로) 쿠키 발급.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const provider = url.searchParams.get("provider") ?? "google";
  const next = safeNext(url.searchParams.get("next"));

  if (!isProvider(provider)) {
    return NextResponse.json({ error: "지원하지 않는 로그인입니다." }, { status: 400 });
  }

  const redirectUri = `${getBaseUrl(request)}${callbackPath(provider)}`;
  const state = crypto.randomUUID();
  const authUrl = getProvider(provider).buildAuthUrl({ redirectUri, state });

  const res = NextResponse.redirect(authUrl);
  const opts = {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 600,
  };
  res.cookies.set(OAUTH_STATE_COOKIE, state, opts);
  res.cookies.set(OAUTH_NEXT_COOKIE, next, opts);
  return res;
}
