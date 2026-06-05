import { NextResponse, type NextRequest } from "next/server";
import { getAdminSession } from "@/lib/auth/dal";
import { saveSubscription, deleteSubscription } from "@/lib/push/store";

/** POST: 구독 저장 (관리자). body { endpoint, keys:{p256dh,auth} } */
export async function POST(request: NextRequest) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  } | null;
  if (!body?.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return NextResponse.json({ error: "invalid subscription" }, { status: 400 });
  }
  await saveSubscription(body.endpoint, {
    p256dh: body.keys.p256dh,
    auth: body.keys.auth,
  });
  return NextResponse.json({ ok: true });
}

/** DELETE: 구독 해제. body { endpoint } */
export async function DELETE(request: NextRequest) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as { endpoint?: string } | null;
  if (!body?.endpoint) {
    return NextResponse.json({ error: "endpoint 필요" }, { status: 400 });
  }
  await deleteSubscription(body.endpoint);
  return NextResponse.json({ ok: true });
}
