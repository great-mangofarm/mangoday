import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { broadcast } from "@/lib/push/send";

/**
 * GET /api/push/run?secret=...
 * notify_at 이 도래(<= now)했고 아직 안 보낸(notified=false) 일정을 푸시하고 notified 처리.
 * 크론(Cloudflare Cron / 외부 스케줄러)이 주기적으로 호출. PUSH_CRON_SECRET 로 보호.
 */
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!process.env.PUSH_CRON_SECRET || secret !== process.env.PUSH_CRON_SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const sb = getSupabaseAdmin();
  const nowIso = new Date().toISOString();
  const { data, error } = await sb
    .from("calendar_events")
    .select("id, title, description")
    .lte("notify_at", nowIso)
    .eq("notified", false)
    .not("notify_at", "is", null);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const events = (data ?? []) as { id: string; title: string; description: string | null }[];
  let totalSent = 0;
  for (const ev of events) {
    const r = await broadcast({
      title: `📅 ${ev.title}`,
      body: ev.description ?? "일정 시간이에요.",
      url: "/calendar",
    });
    totalSent += r.sent;
    await sb.from("calendar_events").update({ notified: true }).eq("id", ev.id);
  }

  return NextResponse.json({ processed: events.length, sent: totalSent });
}
