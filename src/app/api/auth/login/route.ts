import { NextResponse } from "next/server";
import { buildGoogleAuthUrl } from "@/lib/auth/google";
import { OAUTH_STATE_COOKIE, isProd } from "@/lib/auth/session";
import { getBaseUrl, GOOGLE_CALLBACK_PATH } from "@/lib/auth/url";

/** GET /api/auth/login → Google 로그인으로 리다이렉트 (CSRF용 state 쿠키 발급) */
export async function GET(request: Request) {
  const redirectUri = `${getBaseUrl(request)}${GOOGLE_CALLBACK_PATH}`;
  const state = crypto.randomUUID();
  const authUrl = buildGoogleAuthUrl({ redirectUri, state });

  const res = NextResponse.redirect(authUrl);
  res.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
