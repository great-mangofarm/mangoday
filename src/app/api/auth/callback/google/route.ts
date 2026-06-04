import { NextResponse, type NextRequest } from "next/server";
import { exchangeCodeForProfile } from "@/lib/auth/google";
import {
  encryptSession,
  OAUTH_STATE_COOKIE,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  sessionCookieOptions,
} from "@/lib/auth/session";
import { getBaseUrl, GOOGLE_CALLBACK_PATH } from "@/lib/auth/url";

/**
 * GET /api/auth/callback/google
 * Google 에서 돌아온 code 를 토큰으로 교환 → 이메일 검증 →
 * ADMIN_EMAIL 과 일치할 때만 세션 쿠키 발급.
 */
export async function GET(request: NextRequest) {
  const base = getBaseUrl(request);
  const url = new URL(request.url);
  const loginUrl = new URL("/admin/login", base);

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;

  // CSRF: state 일치 확인
  if (!code || !state || !cookieState || state !== cookieState) {
    loginUrl.searchParams.set("error", "invalid_state");
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete(OAUTH_STATE_COOKIE);
    return res;
  }

  let profile;
  try {
    profile = await exchangeCodeForProfile({
      code,
      redirectUri: `${base}${GOOGLE_CALLBACK_PATH}`,
    });
  } catch {
    loginUrl.searchParams.set("error", "exchange_failed");
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete(OAUTH_STATE_COOKIE);
    return res;
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const ok =
    profile.emailVerified &&
    !!adminEmail &&
    profile.email.trim().toLowerCase() === adminEmail;

  if (!ok) {
    loginUrl.searchParams.set("error", "not_authorized");
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete(OAUTH_STATE_COOKIE);
    return res;
  }

  const token = await encryptSession({
    email: profile.email,
    name: profile.name,
    picture: profile.picture,
  });

  const res = NextResponse.redirect(new URL("/admin", base));
  res.cookies.set(SESSION_COOKIE, token, {
    ...sessionCookieOptions,
    maxAge: SESSION_MAX_AGE,
  });
  res.cookies.delete(OAUTH_STATE_COOKIE);
  return res;
}
