<div align="center">

# 🥭 mangoday

**블로그 · 주식/운동 일지 · 캘린더를 한 곳에서 기록하는 개인 공간**

[![live](https://img.shields.io/badge/live-mangoday.blog-f59e0b?style=flat-square)](https://mangoday.blog)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-f38020?style=flat-square&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ecf8e?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)

[**🌐 mangoday.blog**](https://mangoday.blog) 에서 만나보세요

</div>

---

## ✨ 무엇인가요?

**mangoday**는 한 사람(주인)이 글을 쓰고, 방문자는 읽고 댓글을 다는 **개인 블로그 + 기록 플랫폼**이에요.
일상 글부터 주식 매매 일지, 운동 기록, 일정 관리까지 — 흩어진 기록을 한 곳에 모읍니다.

브랜드 컬러는 잘 익은 **망고(amber)** 🥭, UI 톤은 깔끔한 카드형 라이트 테마예요.

## 🧩 기능

| | 기능 | 설명 |
|:--:|---|---|
| 📝 | **블로그** | 노션식 에디터(BlockNote), 글마다 공개/비공개, 태그·검색, 커버·이미지 업로드, SSR SEO |
| 💬 | **댓글** | Google · 카카오 **소셜 로그인** (네이버 예정) |
| 📈 | **주식 일지** | 매매 기록 · 실현손익 · 종목, 총손익/이번달/승률 통계 |
| 💪 | **운동 일지** | 부위별 운동 선택(한글 음차) + 동작 GIF, 운동별 세트 독립 기록 → 날짜별 자동 집계, 볼륨 계산 |
| 📅 | **캘린더** | 일정 + **반복(매일/매주/매월)** + **습관 수행 체크** |
| 📊 | **대시보드** | ApexCharts — 공개 메인 활동 차트 + 관리자 통계 |
| 🔔 | **알림 + PWA** | 웹푸시 일정 알림 + "홈 화면에 추가"(앱처럼 설치) |

> 관리자(주인)는 `/admin`에서 모든 걸 관리하고, 방문자는 공개된 것만 봅니다.

## 🛠️ 기술 스택

- **Next.js 16** (App Router, Turbopack) · React 19 · TypeScript
- **Tailwind CSS v4**
- **Supabase** (Postgres + Storage, RLS)
- **Cloudflare Workers** (`@opennextjs/cloudflare`) — `git push` 자동 배포
- **인증**: 가벼운 Google/Kakao OIDC + `jose` 세션 (Auth.js 미사용)
- **에디터** BlockNote · **차트** ApexCharts · **웹푸시** VAPID + RFC8291(Web Crypto)

## 🚀 로컬 실행

```bash
git clone git@github-new:great-mangofarm/mangoday.git
cd mangoday
npm install
# .env.local 준비 (ONBOARDING.md 참고 — 비밀키 포함)
npm run dev          # http://localhost:3000
```

배포: `main`에 push하면 Cloudflare가 자동 빌드·배포. 로컬 배포는 `npm run deploy`.

## 🗂️ 구조 (요약)

```
src/
├─ app/(public)/      공개: 홈·블로그·주식·운동·캘린더
├─ app/admin/         관리자: 글쓰기·캘린더·대시보드 (로그인 게이트)
├─ app/api/           auth(소셜로그인)·comments·push·admin
├─ components/        blog·comments·journal·calendar·dashboard·pwa
└─ lib/               posts·journal·calendar·auth·push·dashboard
supabase/migrations/  DB 스키마
```

## 📌 더 보기

- **[ONBOARDING.md](./ONBOARDING.md)** — 셋업 절차, 환경변수, 배포·캐시 주의점, **작업 히스토리 & 주요 결정**, 남은 백로그
- **[구현계획.md](./구현계획.md)** — 단계별(Phase) 구현 계획

---

<div align="center">
<sub>🥭 made with mangoday · 개인 프로젝트</sub>
</div>
