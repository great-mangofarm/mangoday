import { cache } from "react";
import { redirect } from "next/navigation";
import { readSession, type AdminSession } from "./session";

/**
 * Data Access Layer — 관리자 인가(authorization) 중앙화.
 * 세션 이메일이 ADMIN_EMAIL 과 일치할 때만 관리자.
 * 모든 관리자 페이지/서버액션은 requireAdmin() 을 거친다.
 */

function adminEmail(): string | undefined {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase();
}

/** 현재 요청이 관리자면 세션을, 아니면 null. (렌더 패스 내 메모이즈) */
export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  const session = await readSession();
  if (!session) return null;
  const admin = adminEmail();
  if (!admin || session.email.trim().toLowerCase() !== admin) return null;
  return session;
});

/** 관리자가 아니면 로그인 페이지로 보낸다. 관리자면 세션 반환. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}
