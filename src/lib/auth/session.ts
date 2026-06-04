import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

/**
 * 관리자 세션 (jose 서명 JWT → HttpOnly 쿠키).
 * Next 16 공식 인증 가이드의 stateless 세션 패턴을 따른다.
 * 서버 전용 — 클라이언트 컴포넌트에서 import 금지.
 */

export const SESSION_COOKIE = "mangoday_session";
export const OAUTH_STATE_COOKIE = "mangoday_oauth_state";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7일(초)

export const isProd = process.env.NODE_ENV === "production";

export interface AdminSession {
  email: string;
  name: string;
  picture?: string;
}

function getKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("환경변수 AUTH_SECRET 가 설정되지 않았습니다.");
  return new TextEncoder().encode(secret);
}

export async function encryptSession(payload: AdminSession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getKey());
}

export async function decryptSession(
  token: string | undefined,
): Promise<AdminSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getKey(), {
      algorithms: ["HS256"],
    });
    if (typeof payload.email !== "string") return null;
    return {
      email: payload.email,
      name: typeof payload.name === "string" ? payload.name : "",
      picture: typeof payload.picture === "string" ? payload.picture : undefined,
    };
  } catch {
    return null;
  }
}

/** 서버 컴포넌트/액션에서 현재 쿠키의 세션을 읽는다(검증 전 원본). */
export async function readSession(): Promise<AdminSession | null> {
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
