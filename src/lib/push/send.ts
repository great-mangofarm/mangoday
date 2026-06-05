import { sendPush } from "./webpush";
import { listSubscriptions, deleteSubscription } from "./store";

export interface PushPayload {
  title: string;
  body?: string;
  url?: string;
}

/** 모든 구독자에게 발송. 만료(404/410) 구독은 정리. */
export async function broadcast(
  payload: PushPayload,
): Promise<{ sent: number; failed: number; total: number }> {
  const subs = await listSubscriptions();
  const json = JSON.stringify(payload);
  let sent = 0;
  let failed = 0;
  for (const s of subs) {
    try {
      const r = await sendPush(s, json);
      if (r.ok) sent += 1;
      else {
        failed += 1;
        if (r.gone) await deleteSubscription(s.endpoint);
      }
    } catch {
      failed += 1;
    }
  }
  return { sent, failed, total: subs.length };
}
