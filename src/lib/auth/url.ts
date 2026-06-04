import type { Provider } from "./providers";

/**
 * 요청에서 공개 base URL 을 추론한다(프록시 헤더 우선).
 * Google/Kakao/Naver redirect_uri 는 인가 요청과 콜백에서 정확히 같아야 하므로 공용 사용.
 */
export function getBaseUrl(request: Request): string {
  const url = new URL(request.url);
  const proto =
    request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    url.host;
  return `${proto}://${host}`;
}

export function callbackPath(provider: Provider): string {
  return `/api/auth/callback/${provider}`;
}

/** next(로그인 후 돌아갈 경로)가 같은 사이트 내부 경로인지 검증 (오픈 리다이렉트 방지) */
export function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}
