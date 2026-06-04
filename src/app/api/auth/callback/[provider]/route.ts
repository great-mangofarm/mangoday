import { NextResponse, type NextRequest } from "next/server";
import { getProvider, isProvider } from "@/lib/auth/providers";
import {
  encryptSession,
  OAUTH_STATE_COOKIE,
  OAUTH_NEXT_COOKIE,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  sessionCookieOptions,
} from "@/lib/auth/session";
import { getBaseUrl, callbackPath, safeNext } from "@/lib/auth/url";

/**
 * GET /api/auth/callback/:provider
 * 소셜 로그인 콜백. code→프로필 교환 후 사용자 세션 쿠키 발급, next 경로로 복귀.
 * 관리자 여부는 여기서 판별하지 않는다(누구나 로그인 가능, 댓글용). 게이트는 DAL.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const base = getBaseUrl(request);
  const { provider } = await params;

  const next = safeNext(request.cookies.get(OAUTH_NEXT_COOKIE)?.value);
  const failUrl = new URL("/login", base);
  failUrl.searchParams.set("next", next);

  function fail(reason: string) {
    failUrl.searchParams.set("error", reason);
    const res = NextResponse.redirect(failUrl);
    res.cookies.delete(OAUTH_STATE_COOKIE);
    res.cookies.delete(OAUTH_NEXT_COOKIE);
    return res;
  }

  if (!isProvider(provider)) return fail("invalid_provider");

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;

  if (!code || !state || !cookieState || state !== cookieState) {
    return fail("invalid_state");
  }

  let profile;
  try {
    profile = await getProvider(provider).fetchProfile({
      code,
      redirectUri: `${base}${callbackPath(provider)}`,
      state,
    });
  } catch (e) {
    console.error("[oauth callback]", provider, e);
    return fail("exchange_failed");
  }

  const token = await encryptSession({
    provider: profile.provider,
    sub: profile.sub,
    name: profile.name,
    picture: profile.picture,
    email: profile.email,
  });

  const res = NextResponse.redirect(new URL(next, base));
  res.cookies.set(SESSION_COOKIE, token, {
    ...sessionCookieOptions,
    maxAge: SESSION_MAX_AGE,
  });
  res.cookies.delete(OAUTH_STATE_COOKIE);
  res.cookies.delete(OAUTH_NEXT_COOKIE);
  return res;
}
