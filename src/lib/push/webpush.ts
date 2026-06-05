import { SignJWT, importJWK } from "jose";

/**
 * Cloudflare Workers(Web Crypto) 호환 웹푸시 발송.
 * - VAPID: jose 로 ES256 JWT 서명
 * - 페이로드: RFC8291(aes128gcm) Web Crypto 로 암호화
 * web-push(Node 전용) 대신 직접 구현.
 */

export interface PushKeys {
  p256dh: string;
  auth: string;
}
export interface PushTarget {
  endpoint: string;
  keys: PushKeys;
}

const enc = new TextEncoder();

// TS 5.9 typed-array 제네릭 회피용 캐스팅 (런타임엔 정상 BufferSource)
const bs = (u: Uint8Array): BufferSource => u as unknown as BufferSource;

function b64urlToBytes(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function bytesToB64url(b: Uint8Array): string {
  let bin = "";
  for (const byte of b) bin += String.fromCharCode(byte);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function concat(...arrs: Uint8Array[]): Uint8Array {
  const len = arrs.reduce((s, a) => s + a.length, 0);
  const out = new Uint8Array(len);
  let off = 0;
  for (const a of arrs) {
    out.set(a, off);
    off += a.length;
  }
  return out;
}

function vapidPublic(): string {
  const v = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!v) throw new Error("NEXT_PUBLIC_VAPID_PUBLIC_KEY 미설정");
  return v;
}

async function vapidAuthHeader(endpoint: string): Promise<string> {
  const url = new URL(endpoint);
  const aud = `${url.protocol}//${url.host}`;
  const pub = vapidPublic();
  const d = process.env.VAPID_PRIVATE_KEY;
  const sub = process.env.VAPID_SUBJECT;
  if (!d || !sub) throw new Error("VAPID_PRIVATE_KEY/SUBJECT 미설정");
  const pubBytes = b64urlToBytes(pub); // 65 bytes, 0x04||x||y
  const x = bytesToB64url(pubBytes.slice(1, 33));
  const y = bytesToB64url(pubBytes.slice(33, 65));
  const key = await importJWK({ kty: "EC", crv: "P-256", x, y, d }, "ES256");
  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: "ES256", typ: "JWT" })
    .setSubject(sub)
    .setAudience(aud)
    .setExpirationTime("12h")
    .sign(key);
  return `vapid t=${jwt}, k=${pub}`;
}

async function hkdf(
  salt: Uint8Array,
  ikm: Uint8Array,
  info: Uint8Array,
  length: number,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", bs(ikm), "HKDF", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt: bs(salt), info: bs(info) },
    key,
    length * 8,
  );
  return new Uint8Array(bits);
}

async function encryptPayload(
  payload: string,
  p256dh: string,
  auth: string,
): Promise<Uint8Array> {
  const subtle = crypto.subtle;
  const uaPublic = b64urlToBytes(p256dh); // 65
  const authSecret = b64urlToBytes(auth); // 16

  const asKeyPair = await subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"],
  );
  const asPublic = new Uint8Array(await subtle.exportKey("raw", asKeyPair.publicKey)); // 65
  const uaKey = await subtle.importKey(
    "raw",
    bs(uaPublic),
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );
  const ecdh = new Uint8Array(
    await subtle.deriveBits({ name: "ECDH", public: uaKey }, asKeyPair.privateKey, 256),
  );

  // RFC8291: IKM = HKDF(salt=auth, ikm=ecdh, info="WebPush: info\0"||uaPub||asPub, 32)
  const keyInfo = concat(enc.encode("WebPush: info\0"), uaPublic, asPublic);
  const ikm = await hkdf(authSecret, ecdh, keyInfo, 32);

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, enc.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, enc.encode("Content-Encoding: nonce\0"), 12);

  const plaintext = concat(enc.encode(payload), new Uint8Array([0x02])); // delimiter, no padding
  const aesKey = await subtle.importKey("raw", bs(cek), { name: "AES-GCM" }, false, ["encrypt"]);
  const ciphertext = new Uint8Array(
    await subtle.encrypt({ name: "AES-GCM", iv: bs(nonce), tagLength: 128 }, aesKey, bs(plaintext)),
  );

  // aes128gcm header: salt(16) || rs(4) || idlen(1) || keyid(asPublic 65)
  const rs = new Uint8Array([0, 0, 0x10, 0]); // 4096
  const header = concat(salt, rs, new Uint8Array([65]), asPublic);
  return concat(header, ciphertext);
}

export interface SendResult {
  ok: boolean;
  status: number;
  /** 404/410 → 만료된 구독, 삭제 필요 */
  gone: boolean;
}

export async function sendPush(
  target: PushTarget,
  payload: string,
): Promise<SendResult> {
  const headers: Record<string, string> = {
    Authorization: await vapidAuthHeader(target.endpoint),
    TTL: "86400",
    "Content-Encoding": "aes128gcm",
    "Content-Type": "application/octet-stream",
  };
  const body = await encryptPayload(payload, target.keys.p256dh, target.keys.auth);
  const res = await fetch(target.endpoint, { method: "POST", headers, body: bs(body) });
  return { ok: res.ok, status: res.status, gone: res.status === 404 || res.status === 410 };
}
