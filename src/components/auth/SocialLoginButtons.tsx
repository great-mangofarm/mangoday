import { configuredProviders, type Provider } from "@/lib/auth/providers";

/**
 * 설정된(환경변수 있는) 소셜 로그인 버튼만 렌더.
 * 카카오/네이버는 자격증명 등록 전까지 자동으로 숨겨진다.
 */
export function SocialLoginButtons({
  next,
  only,
}: {
  next: string;
  only?: Provider[];
}) {
  let providers = configuredProviders();
  if (only) providers = providers.filter((p) => only.includes(p));

  if (providers.length === 0) {
    return (
      <p className="rounded-lg bg-surface px-4 py-3 text-center text-sm text-muted">
        아직 사용 가능한 로그인 수단이 없어요.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {providers.map((p) => (
        <a
          key={p}
          href={`/api/auth/login?provider=${p}&next=${encodeURIComponent(next)}`}
          className={`flex w-full items-center justify-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${STYLES[p]}`}
        >
          {GLYPH[p]}
          {LABEL[p]}
        </a>
      ))}
    </div>
  );
}

const LABEL: Record<Provider, string> = {
  google: "Google로 로그인",
  kakao: "카카오로 로그인",
  naver: "네이버로 로그인",
};

const STYLES: Record<Provider, string> = {
  google: "border border-border bg-white text-foreground hover:bg-surface",
  kakao: "bg-[#FEE500] text-[#191600] hover:brightness-95",
  naver: "bg-[#03C75A] text-white hover:brightness-95",
};

const GLYPH: Record<Provider, React.ReactNode> = {
  google: (
    <svg viewBox="0 0 18 18" className="h-5 w-5" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.72A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95L3.97 7.28C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  ),
  kakao: (
    <svg viewBox="0 0 18 18" className="h-5 w-5" aria-hidden="true" fill="#191600">
      <path d="M9 1.5C4.86 1.5 1.5 4.1 1.5 7.3c0 2.07 1.4 3.88 3.5 4.9-.15.52-.56 1.9-.64 2.2-.1.37.14.37.29.27.12-.08 1.86-1.26 2.62-1.78.4.06.81.09 1.23.09 4.14 0 7.5-2.6 7.5-5.8S13.14 1.5 9 1.5z" />
    </svg>
  ),
  naver: (
    <svg viewBox="0 0 18 18" className="h-5 w-5" aria-hidden="true" fill="#fff">
      <path d="M11.4 9.6 6.4 2.5H2.5v13h4.1V8.4l5 7.1h3.9v-13h-4.1v7.1z" />
    </svg>
  ),
};
