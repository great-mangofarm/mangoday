import Link from "next/link";
import { redirect } from "next/navigation";
import { MangoMark } from "@/components/site/MangoMark";
import { getAdminSession } from "@/lib/auth/dal";

export const metadata = {
  title: "관리자 로그인",
  robots: { index: false, follow: false },
};

const ERRORS: Record<string, string> = {
  not_authorized: "이 계정은 관리자가 아니에요. 등록된 관리자 계정으로 로그인해 주세요.",
  invalid_state: "로그인 요청이 만료됐어요. 다시 시도해 주세요.",
  exchange_failed: "Google 인증에 실패했어요. 잠시 후 다시 시도해 주세요.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // 이미 관리자면 대시보드로
  const session = await getAdminSession();
  if (session) redirect("/admin");

  const { error } = await searchParams;
  const message = error ? ERRORS[error] ?? "로그인에 실패했어요." : null;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-surface px-6">
      <Link href="/" className="flex flex-col items-center gap-3">
        <MangoMark className="h-12 w-12" />
        <span className="text-lg font-bold">mangoday</span>
      </Link>

      <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-8 shadow-sm">
        <h1 className="text-center text-xl font-bold">관리자 로그인</h1>
        <p className="mt-2 text-center text-sm text-muted">
          글을 쓰려면 관리자 계정으로 로그인하세요.
        </p>

        {message && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-center text-sm text-red-600">
            {message}
          </p>
        )}

        <a
          href="/api/auth/login"
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium text-foreground transition hover:bg-surface"
        >
          <GoogleGlyph />
          Google로 로그인
        </a>
      </div>

      <Link href="/" className="text-sm text-muted hover:underline">
        ← 블로그로 돌아가기
      </Link>
    </main>
  );
}

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 18 18" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95L3.97 7.28C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}
