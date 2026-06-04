import { cache } from "react";
import { redirect } from "next/navigation";
import { readSession, type UserSession } from "./session";

/**
 * Data Access Layer — 세션/인가 중앙화.
 * - getUserSession: 로그인한 사용자(아무 프로바이더) — 댓글 작성자용
 * - getAdminSession: Google + ADMIN_EMAIL 일치 시에만 관리자
 */

function adminEmail(): string | undefined {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase();
}

/** 로그인한 사용자 세션(아무나). (렌더 패스 내 메모이즈) */
export const getUserSession = cache(async (): Promise<UserSession | null> => {
  return readSession();
});

/** 관리자면 세션, 아니면 null. */
export const getAdminSession = cache(async (): Promise<UserSession | null> => {
  const session = await getUserSession();
  if (!session) return null;
  const admin = adminEmail();
  const ok =
    session.provider === "google" &&
    !!admin &&
    !!session.email &&
    session.email.trim().toLowerCase() === admin;
  return ok ? session : null;
});

/** 관리자가 아니면 로그인 페이지로. */
export async function requireAdmin(): Promise<UserSession> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

/** 로그인 안 했으면 null (서버액션에서 인증 확인용). */
export async function requireUser(): Promise<UserSession | null> {
  return getUserSession();
}
