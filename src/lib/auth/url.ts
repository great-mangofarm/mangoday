/**
 * 요청에서 공개 base URL 을 추론한다(프록시 헤더 우선).
 * Google redirect_uri 는 인가 요청과 콜백에서 정확히 같아야 하므로 공용 사용.
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

export const GOOGLE_CALLBACK_PATH = "/api/auth/callback/google";
