import Link from "next/link";
import { MangoMark } from "@/components/site/MangoMark";
import { requireAdmin } from "@/lib/auth/dal";
import { signOut } from "@/lib/auth/actions";

export const metadata = {
  title: "관리자",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();

  return (
    <div className="min-h-dvh bg-surface">
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/admin" className="flex items-center gap-2">
            <MangoMark className="h-7 w-7" />
            <span className="font-bold">mangoday</span>
            <span className="rounded-md bg-primary-100 px-1.5 py-0.5 text-xs font-semibold text-primary-700">
              관리자
            </span>
          </Link>

          <nav className="hidden items-center gap-4 text-sm sm:flex">
            <Link href="/admin" className="text-muted hover:text-foreground">글</Link>
            <Link href="/admin/calendar" className="text-muted hover:text-foreground">캘린더</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm text-muted hover:text-foreground"
            >
              사이트 보기
            </Link>
            <span className="hidden text-sm text-muted sm:inline">
              {session.name || session.email}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-surface"
              >
                로그아웃
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
