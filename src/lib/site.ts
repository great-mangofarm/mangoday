/**
 * 사이트 전역 설정. SEO(metadataBase, sitemap, robots)와 헤더/푸터에서 공유.
 * 배포 후 NEXT_PUBLIC_SITE_URL 을 실제 도메인으로 채운다(Phase 9).
 * (빌드 시점 인라인 값 — Cloudflare Workers Builds 환경변수로 주입)
 */
export const siteConfig = {
  name: "mangoday",
  title: "mangoday",
  description: "블로그 · 주식/운동 일지 · 일정까지 한 곳에서 기록하는 개인 공간",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "ko_KR",
} as const;

/** 공개 영역 네비게이션 */
export const navItems = [
  { href: "/blog", label: "블로그" },
  { href: "/stock", label: "주식일지" },
  { href: "/workout", label: "운동일지" },
  { href: "/calendar", label: "캘린더" },
] as const;
