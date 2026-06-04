import { createRemoteJWKSet, jwtVerify } from "jose";

/**
 * Google OIDC 헬퍼.
 * - 인가 URL 생성 → Google 로그인
 * - code → token 교환 (서버-서버, client_secret 사용)
 * - id_token 을 Google JWKS 로 검증해 이메일 확인
 */

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);

function clientId(): string {
  const id = process.env.AUTH_GOOGLE_ID;
  if (!id) throw new Error("환경변수 AUTH_GOOGLE_ID 가 설정되지 않았습니다.");
  return id;
}

function clientSecret(): string {
  const secret = process.env.AUTH_GOOGLE_SECRET;
  if (!secret) throw new Error("환경변수 AUTH_GOOGLE_SECRET 가 설정되지 않았습니다.");
  return secret;
}

export function buildGoogleAuthUrl(opts: {
  redirectUri: string;
  state: string;
}): string {
  const params = new URLSearchParams({
    client_id: clientId(),
    redirect_uri: opts.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state: opts.state,
    prompt: "select_account",
    access_type: "online",
  });
  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

export interface GoogleProfile {
  email: string;
  emailVerified: boolean;
  name: string;
  picture?: string;
}

export async function exchangeCodeForProfile(opts: {
  code: string;
  redirectUri: string;
}): Promise<GoogleProfile> {
  const body = new URLSearchParams({
    code: opts.code,
    client_id: clientId(),
    client_secret: clientSecret(),
    redirect_uri: opts.redirectUri,
    grant_type: "authorization_code",
  });

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google 토큰 교환 실패(${res.status}): ${text}`);
  }

  const tokens = (await res.json()) as { id_token?: string };
  if (!tokens.id_token) throw new Error("Google 응답에 id_token 이 없습니다.");

  const { payload } = await jwtVerify(tokens.id_token, JWKS, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: clientId(),
  });

  if (typeof payload.email !== "string") {
    throw new Error("id_token 에 email 클레임이 없습니다.");
  }

  return {
    email: payload.email,
    emailVerified: payload.email_verified === true,
    name: typeof payload.name === "string" ? payload.name : "",
    picture: typeof payload.picture === "string" ? payload.picture : undefined,
  };
}
