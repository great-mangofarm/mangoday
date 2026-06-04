import Link from "next/link";
import { siteConfig } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-4 py-8 text-sm text-muted sm:flex-row sm:px-6">
        <p>
          © {new Date().getFullYear()} {siteConfig.name}
        </p>
        <div className="flex items-center gap-3">
          <span>블로그 · 일지 · 일정</span>
          <Link href="/admin" className="text-muted/70 hover:text-foreground">
            관리자
          </Link>
        </div>
      </div>
    </footer>
  );
}
