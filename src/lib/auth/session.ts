import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Provider } from "./providers";

/**
 * 로그인 사용자 세션 (jose 서명 JWT → HttpOnly 쿠키).
 * 관리자/댓글 작성자 공용. 관리자 여부는 DAL 에서 이메일로 판별.
 * 서버 전용 — 클라이언트 컴포넌트에서 import 금지.
 */

export const SESSION_COOKIE = "mangoday_session";
export const OAUTH_STATE_COOKIE = "mangoday_oauth_state";
export const OAUTH_NEXT_COOKIE = "mangoday_oauth_next";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30일(초)

export const isProd = process.env.NODE_ENV === "production";

export interface UserSession {
  provider: Provider;
  sub: string; // 프로바이더 내 고유 id
  name: string;
  picture?: string;
  email?: string;
}

/** 동일인 식별 키 (provider + sub) */
export function sessionKey(s: Pick<UserSession, "provider" | "sub">): string {
  return `${s.provider}:${s.sub}`;
}

function getKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("환경변수 AUTH_SECRET 가 설정되지 않았습니다.");
  return new TextEncoder().encode(secret);
}

export async function encryptSession(payload: UserSession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getKey());
}

export async function decryptSession(
  token: string | undefined,
): Promise<UserSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getKey(), {
      algorithms: ["HS256"],
    });
    if (typeof payload.provider !== "string" || typeof payload.sub !== "string") {
      return null;
    }
    return {
      provider: payload.provider as Provider,
      sub: payload.sub,
      name: typeof payload.name === "string" ? payload.name : "",
      picture: typeof payload.picture === "string" ? payload.picture : undefined,
      email: typeof payload.email === "string" ? payload.email : undefined,
    };
  } catch {
    return null;
  }
}

/** 서버 컴포넌트/액션에서 현재 쿠키의 세션을 읽는다. */
export async function readSession(): Promise<UserSession | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return decryptSession(token);
}

/** NextResponse.cookies.set 에 넘길 옵션 */
export const sessionCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax" as const,
  path: "/",
};
