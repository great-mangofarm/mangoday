import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/dal";
import { broadcast } from "@/lib/push/send";

/** POST: 테스트 알림 발송 (관리자) */
export async function POST() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await broadcast({
    title: "mangoday 🥭",
    body: "푸시 알림 테스트입니다. 잘 도착했어요!",
    url: "/",
  });
  return NextResponse.json(result);
}
