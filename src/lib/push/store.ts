import { getSupabaseAdmin } from "@/lib/supabase";
import type { PushKeys, PushTarget } from "./webpush";

/** push_subscriptions 저장/조회/삭제 (service role) */

export async function saveSubscription(
  endpoint: string,
  keys: PushKeys,
): Promise<void> {
  const sb = getSupabaseAdmin();
  const { error } = await sb
    .from("push_subscriptions")
    .upsert({ endpoint, keys }, { onConflict: "endpoint" });
  if (error) throw new Error(`구독 저장 실패: ${error.message}`);
}

export async function deleteSubscription(endpoint: string): Promise<void> {
  const sb = getSupabaseAdmin();
  const { error } = await sb.from("push_subscriptions").delete().eq("endpoint", endpoint);
  if (error) throw new Error(`구독 삭제 실패: ${error.message}`);
}

export async function listSubscriptions(): Promise<PushTarget[]> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb.from("push_subscriptions").select("endpoint, keys");
  if (error) throw new Error(`구독 조회 실패: ${error.message}`);
  return (data ?? []) as PushTarget[];
}
