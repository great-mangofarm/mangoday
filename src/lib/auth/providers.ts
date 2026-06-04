import { createRemoteJWKSet, jwtVerify } from "jose";

/**
 * 소셜 로그인 프로바이더 레지스트리.
 * - google: OIDC (id_token JWKS 검증)
 * - kakao / naver: OAuth2 + userinfo 엔드포인트
 * 각 프로바이더의 프로필을 NormalizedProfile 로 통일.
 */

export type Provider = "google" | "kakao" | "naver";
export const PROVIDERS: Provider[] = ["google", "kakao", "naver"];

export function isProvider(value: string): value is Provider {
  return (PROVIDERS as string[]).includes(value);
}

export interface NormalizedProfile {
  provider: Provider;
  sub: string;
  name: string;
  picture?: string;
  email?: string;
  emailVerified?: boolean;
}

interface AuthUrlOpts {
  redirectUri: string;
  state: string;
}
interface FetchOpts {
  code: string;
  redirectUri: string;
  state: string;
}
interface ProviderImpl {
  buildAuthUrl(o: AuthUrlOpts): string;
  fetchProfile(o: FetchOpts): Promise<NormalizedProfile>;
}

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`환경변수 ${name} 가 설정되지 않았습니다.`);
  return v;
}

async function postForm(url: string, params: URLSearchParams): Promise<Response> {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
}

// ─────────────────────────────── Google (OIDC) ───────────────────────────────
const GOOGLE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);

const google: ProviderImpl = {
  buildAuthUrl({ redirectUri, state }) {
    const p = new URLSearchParams({
      client_id: env("AUTH_GOOGLE_ID"),
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      prompt: "select_account",
      access_type: "online",
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${p}`;
  },
  async fetchProfile({ code, redirectUri }) {
    const res = await postForm(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        code,
        client_id: env("AUTH_GOOGLE_ID"),
        client_secret: env("AUTH_GOOGLE_SECRET"),
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    );
    if (!res.ok) throw new Error(`google token ${res.status}: ${await res.text()}`);
    const { id_token } = (await res.json()) as { id_token?: string };
    if (!id_token) throw new Error("google: id_token 없음");
    const { payload } = await jwtVerify(id_token, GOOGLE_JWKS, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: env("AUTH_GOOGLE_ID"),
    });
    return {
      provider: "google",
      sub: String(payload.sub),
      name: typeof payload.name === "string" ? payload.name : "",
      picture: typeof payload.picture === "string" ? payload.picture : undefined,
      email: typeof payload.email === "string" ? payload.email : undefined,
      emailVerified: payload.email_verified === true,
    };
  },
};

// ─────────────────────────────── Kakao ───────────────────────────────
const kakao: ProviderImpl = {
  buildAuthUrl({ redirectUri, state }) {
    const p = new URLSearchParams({
      client_id: env("AUTH_KAKAO_ID"),
      redirect_uri: redirectUri,
      response_type: "code",
      state,
      scope: "profile_nickname profile_image",
    });
    return `https://kauth.kakao.com/oauth/authorize?${p}`;
  },
  async fetchProfile({ code, redirectUri }) {
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: env("AUTH_KAKAO_ID"),
      redirect_uri: redirectUri,
      code,
    });
    if (process.env.AUTH_KAKAO_SECRET) {
      params.set("client_secret", process.env.AUTH_KAKAO_SECRET);
    }
    const tok = await postForm("https://kauth.kakao.com/oauth/token", params);
    if (!tok.ok) throw new Error(`kakao token ${tok.status}: ${await tok.text()}`);
    const { access_token } = (await tok.json()) as { access_token?: string };
    if (!access_token) throw new Error("kakao: access_token 없음");

    const me = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!me.ok) throw new Error(`kakao me ${me.status}: ${await me.text()}`);
    const data = (await me.json()) as {
      id: number;
      kakao_account?: {
        email?: string;
        is_email_verified?: boolean;
        profile?: { nickname?: string; profile_image_url?: string };
      };
    };
    const profile = data.kakao_account?.profile ?? {};
    return {
      provider: "kakao",
      sub: String(data.id),
      name: profile.nickname ?? "카카오 사용자",
      picture: profile.profile_image_url,
      email: data.kakao_account?.email,
      emailVerified: data.kakao_account?.is_email_verified === true,
    };
  },
};

// ─────────────────────────────── Naver ───────────────────────────────
const naver: ProviderImpl = {
  buildAuthUrl({ redirectUri, state }) {
    const p = new URLSearchParams({
      response_type: "code",
      client_id: env("AUTH_NAVER_ID"),
      redirect_uri: redirectUri,
      state,
    });
    return `https://nid.naver.com/oauth2.0/authorize?${p}`;
  },
  async fetchProfile({ code, state }) {
    const tok = await postForm(
      "https://nid.naver.com/oauth2.0/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        client_id: env("AUTH_NAVER_ID"),
        client_secret: env("AUTH_NAVER_SECRET"),
        code,
        state,
      }),
    );
    if (!tok.ok) throw new Error(`naver token ${tok.status}: ${await tok.text()}`);
    const { access_token } = (await tok.json()) as { access_token?: string };
    if (!access_token) throw new Error("naver: access_token 없음");

    const me = await fetch("https://openapi.naver.com/v1/nid/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!me.ok) throw new Error(`naver me ${me.status}: ${await me.text()}`);
    const body = (await me.json()) as {
      response?: {
        id: string;
        nickname?: string;
        name?: string;
        profile_image?: string;
        email?: string;
      };
    };
    const r = body.response;
    if (!r?.id) throw new Error("naver: 프로필 응답 없음");
    return {
      provider: "naver",
      sub: String(r.id),
      name: r.nickname ?? r.name ?? "네이버 사용자",
      picture: r.profile_image,
      email: r.email,
    };
  },
};

const REGISTRY: Record<Provider, ProviderImpl> = { google, kakao, naver };

export function getProvider(provider: Provider): ProviderImpl {
  return REGISTRY[provider];
}

/** 해당 프로바이더에 필요한 환경변수가 설정돼 있는지 (버튼 노출 판단용) */
export function isProviderConfigured(provider: Provider): boolean {
  switch (provider) {
    case "google":
      return !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
    case "kakao":
      return !!process.env.AUTH_KAKAO_ID;
    case "naver":
      return !!(process.env.AUTH_NAVER_ID && process.env.AUTH_NAVER_SECRET);
  }
}

/** 현재 사용 가능한(설정된) 프로바이더 목록 */
export function configuredProviders(): Provider[] {
  return PROVIDERS.filter(isProviderConfigured);
}
