import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase 클라이언트 헬퍼.
 *
 * - getSupabaseAnon(): 공개 읽기용 (anon key). RLS 정책의 보호를 받음.
 * - getSupabaseAdmin(): 서버 전용 쓰기/관리용 (service role key). RLS 우회.
 *   절대 클라이언트(브라우저) 코드에서 import 하지 말 것.
 *
 * Cloudflare Workers/Next 서버에서 요청마다 가볍게 생성합니다.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`환경변수 ${name} 가 설정되지 않았습니다. .env.local 을 확인하세요.`);
  }
  return value;
}

export function getSupabaseAnon(): SupabaseClient {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    { auth: { persistSession: false } },
  );
}

export function getSupabaseAdmin(): SupabaseClient {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } },
  );
}
