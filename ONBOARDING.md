# mangoday — 작업 인수인계 가이드

개인 블로그/일지/캘린더 사이트. 새 컴퓨터에서 이 프로젝트를 이어서 작업하기 위한 가이드.
이 문서를 Claude Code에서 열면 지금까지의 맥락을 이어받을 수 있다.

---

## ⚠️ 가장 중요한 규칙 (AGENTS.md)

**This is NOT the Next.js you know.** 이 프로젝트의 Next.js(16.x)는 학습 데이터와 API/관례/파일구조가 다를 수 있는 breaking change 버전이다.
코드를 쓰기 전에 반드시 `node_modules/next/dist/docs/` 안의 관련 문서를 읽고, deprecation 경고를 따른다.

---

## 현재 상태 (2026-06)

| Phase | 내용 | 상태 |
|---|---|---|
| 0 | 프로젝트 세팅 | ✅ 완료 |
| 1 | 데이터 모델 (Supabase) | ✅ 완료 |
| 2 | 공개 블로그 + 태그 검색 + SEO | ✅ 완료 |
| 3 | 관리자 + 글쓰기(공개토글) | 🟡 코드 완료, Google 자격증명 대기 |
| 4 | 덧글 (소셜 로그인: Naver/Kakao/Google) | ⬜ |
| 5 | 테마별 일지 (주식/운동) | ⬜ |
| 6 | 캘린더 (반복·수행체크) | ⬜ |
| 7 | 대시보드 2종 (ApexCharts) | ⬜ |
| 8 | 알림 + PWA | ⬜ |
| 9 | 도메인 연결 + 배포 마무리 | ⬜ |

**라이브 사이트:** https://mangoday.my-schedule.workers.dev (Phase 2까지 배포됨, 모든 라우트 200)

---

## 기술 스택

- **Next.js 16.x** (App Router, Turbopack) + React 19 + TypeScript
- **Tailwind CSS v4** — `@theme` 블록으로 색상 토큰 정의 (`src/app/globals.css`)
- **Supabase** — DB + 인증. `getSupabaseAnon()`(공개 읽기, RLS) / `getSupabaseAdmin()`(서버전용, service role)
- **Cloudflare Workers** — `@opennextjs/cloudflare` 어댑터 + wrangler 로 배포
- **에디터(예정):** BlockNote (노션 스타일)
- **차트(예정):** ApexCharts

### 캐시 모델 주의
`cacheComponents` 미사용 → **기존(previous) 캐시 모델** 사용 중.
즉 `export const revalidate = 60` + `generateStaticParams` + `dynamicParams` 방식.
(NEW 모델인 `use cache`/`cacheLife`/`cacheTag` 는 쓰지 않음.)

---

## 디자인 / 브랜드

- 메인 컬러 = **망고색(amber)**. `globals.css @theme` 에서 `--color-primary-*` 를 amber 스케일로 정의 (`bg-primary-500` 등 사용).
- UI 톤 = **사운드클라우드 / 레딧** 느낌. 밝고 깔끔한 카드형 **라이트 테마 고정** (다크모드 자동전환 안 씀 — 추후 별도 디자인).
- 로고: `src/components/site/MangoMark.tsx` (인라인 SVG), 파비콘 `src/app/icon.svg`. 풀 로고(글씨 포함)는 사장님이 직접 만들 예정이라 보류.
- 메인 페이지 상단 히어로 배너는 **제거함**(사장님 요청).

---

## 배포 (중요)

**Cloudflare Workers Builds 로 git-push 자동배포** 가 연결돼 있다.
- `main` 브랜치에 `git push` → Cloudflare가 자동으로 빌드+배포
- Build command: `npx opennextjs-cloudflare build`
- Deploy command: `npx wrangler deploy`
- 진행상황: Cloudflare 대시보드 → Workers & Pages → mangoday → **Deployments** 탭
- 로컬에서 직접 배포도 가능: `npm run deploy`

### 빌드 환경변수
`NEXT_PUBLIC_SITE_URL` 은 **빌드 시점에 코드에 인라인**되는 값이다(`src/lib/site.ts`).
`.env.local` 은 gitignore라 Cloudflare 빌드에 안 들어가므로, **Cloudflare Workers Builds 설정의 "Variables and secrets"** 에 `NEXT_PUBLIC_SITE_URL` 을 등록해 둠.
런타임용 Supabase 공개키 2개는 `wrangler.jsonc` 의 `vars` 에 들어있음(공개 가능값이라 커밋 OK).

---

## 🔧 새 컴퓨터 셋업 절차

```bash
# 1) 클론 (이 머신의 SSH 별칭 사용 — 아래 설명 참고)
git clone git@github-new:great-mangofarm/mangoday.git
cd mangoday

# 2) 의존성 설치
npm install

# 3) .env.local 재생성 (아래 참고 — 깃에 없음!)

# 4) 개발 서버
npm run dev
```

### GitHub 다계정 SSH 설정 (필수)
이 레포 소유자는 GitHub 계정 **great-mangofarm** 이고, `~/.ssh/config` 의 호스트 별칭 **`github-new`** 가 그 계정 키에 연결돼 있다.
새 컴퓨터에도 `~/.ssh/config` 에 아래처럼 별칭을 만들고, 해당 SSH 키를 GitHub great-mangofarm 계정에 등록해야 push가 된다:

```
Host github-new
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_new
```

origin URL 이 `git@github-new:great-mangofarm/mangoday.git` 형태인지 `git remote -v` 로 확인.
(별칭 설정이 귀찮으면 HTTPS + great-mangofarm 계정 Personal Access Token 으로 대체 가능.)

### `.env.local` 재생성 (gitignore라 직접 옮겨야 함 — 비밀키 포함)
아래 키들이 필요. **값은 깃에 없으니** 기존 컴퓨터의 `.env.local` 을 안전하게 옮기거나(비밀번호 관리자/USB), Supabase 대시보드에서 다시 복사한다. 이 문서나 깃에 절대 평문으로 넣지 말 것.

```
NEXT_PUBLIC_SITE_URL=https://mangoday.my-schedule.workers.dev
NEXT_PUBLIC_SUPABASE_URL=...           # 공개값 (wrangler.jsonc 에도 있음)
NEXT_PUBLIC_SUPABASE_ANON_KEY=...      # 공개값 (publishable)
SUPABASE_SERVICE_ROLE_KEY=...          # 🔒 비밀! 브라우저/깃 절대 금지
ADMIN_EMAIL=pushpullandlegs@gmail.com
AUTH_SECRET=...                        # 🔒 세션 서명용. `openssl rand -base64 32`
AUTH_GOOGLE_ID=...                     # Google Cloud OAuth client ID
AUTH_GOOGLE_SECRET=...                 # 🔒 Google OAuth client secret
# AUTH_KAKAO_*, AUTH_NAVER_* (Phase 4), VAPID_* (Phase 8) 은 해당 Phase에서 채움
```

---

## 🔒 보안 규칙 (절대 위반 금지)

- `.env.local`, `.dev.vars` 는 **항상 gitignore 유지** (진짜 Supabase 비밀키 포함).
- `SUPABASE_SERVICE_ROLE_KEY` 는 **브라우저 코드/깃/공유문서에 절대 금지**. 서버 전용. Cloudflare엔 `wrangler secret put` 으로만.
- publishable/anon 키와 Supabase URL 은 공개 가능값이라 `wrangler.jsonc` 커밋 OK.
- `.idea/`, `.claude/settings.local.json` 커밋 금지.

---

## Phase 3 (관리자 + 글쓰기) — 코드 완료 🟡

**인증 방식: Google 로그인만** (사장님 결정). Auth.js 안 씀 — 가벼운 Google OIDC + `jose` 세션 쿠키.
관리자 = 세션 이메일이 `ADMIN_EMAIL` 과 일치할 때만. BlockNote 에디터, 공개/비공개·상태(초안/발행)·태그·커버, 이미지 업로드까지 구현+검증 완료.

### 구조
- `src/lib/auth/session.ts` — jose JWT 세션(HttpOnly 쿠키 `mangoday_session`)
- `src/lib/auth/google.ts` — Google OIDC: 인가 URL, code→token 교환, id_token JWKS 검증
- `src/lib/auth/dal.ts` — `getAdminSession()` / `requireAdmin()` (관리자 게이트)
- `src/lib/auth/actions.ts` — `signOut()`
- `src/app/api/auth/{login,callback/google}/route.ts` — OAuth 라우트 (state CSRF 쿠키)
- `src/app/admin/login/page.tsx` — 로그인(가드 밖)
- `src/app/admin/(dashboard)/...` — 가드된 대시보드/에디터 (route group)
- `src/lib/admin/posts.ts` + `actions.ts` — service role CRUD + slug 중복검사
- `src/components/admin/PostEditor.tsx` — BlockNote(클라이언트). 본문/커버 이미지 업로드.
- `src/app/api/admin/upload/route.ts` — 이미지 업로드 → Supabase Storage **공개 버킷 `post-images`**

### 🔑 남은 작업 (사용하려면)
1. **Google OAuth 자격증명 발급** (console.cloud.google.com → OAuth client ID, Web).
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`,
     `https://mangoday.my-schedule.workers.dev/api/auth/callback/google`
   - 발급한 Client ID/Secret → `.env.local` 의 `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
   - OAuth consent screen Test users 에 `pushpullandlegs@gmail.com` 추가
2. **프로덕션(Cloudflare) 런타임 시크릿** — 관리자를 prod 에서 쓰려면 배포된 Worker 에 설정:
   `wrangler secret put` 으로 `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`,
   `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL`
   (또는 대시보드 Worker → Settings → Variables and Secrets). 공개 사이트는 이것 없이도 정상.

> 공개 블로그는 anon 키만 쓰므로 위 시크릿 없이도 동작함. 관리자(/admin)만 영향.
