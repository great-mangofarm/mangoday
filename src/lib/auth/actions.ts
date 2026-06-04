"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "./session";

/** 로그아웃: 세션 쿠키 삭제 후 홈으로. */
export async function signOut() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/");
}
