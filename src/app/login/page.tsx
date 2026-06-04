import Link from "next/link";
import { MangoMark } from "@/components/site/MangoMark";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";
import { safeNext } from "@/lib/auth/url";

export const metadata = {
  title: "로그인",
  robots: { index: false, follow: false },
};

const ERRORS: Record<string, string> = {
  invalid_state: "로그인 요청이 만료됐어요. 다시 시도해 주세요.",
  exchange_failed: "로그인에 실패했어요. 잠시 후 다시 시도해 주세요.",
  invalid_provider: "지원하지 않는 로그인 수단이에요.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next: rawNext, error } = await searchParams;
  const next = safeNext(rawNext);
  const message = error ? (ERRORS[error] ?? "로그인에 실패했어요.") : null;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-surface px-6">
      <Link href="/" className="flex flex-col items-center gap-3">
        <MangoMark className="h-12 w-12" />
        <span className="text-lg font-bold">mangoday</span>
      </Link>

      <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-8 shadow-sm">
        <h1 className="text-center text-xl font-bold">로그인</h1>
        <p className="mt-2 text-center text-sm text-muted">
          소셜 계정으로 로그인하고 댓글을 남겨보세요.
        </p>

        {message && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-center text-sm text-red-600">
            {message}
          </p>
        )}

        <div className="mt-6">
          <SocialLoginButtons next={next} />
        </div>
      </div>

      <Link href={next} className="text-sm text-muted hover:underline">
        ← 돌아가기
      </Link>
    </main>
  );
}
