-- ============================================================
-- mangoday 스토리지 (Phase 3)
-- 글 본문/커버 이미지 업로드용 공개 버킷.
-- 업로드는 서버(service role, requireAdmin 통과 후)에서만 수행하고,
-- 읽기는 공개 URL 로 누구나 가능(공개 블로그 이미지).
--
-- 참고: 코드에서는 service role 로 storage.createBucket 으로 이미 생성됨.
-- 이 파일은 새 환경에서 재현/문서화를 위한 것. SQL Editor 에 붙여넣어 실행 가능.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-images',
  'post-images',
  true,
  10485760, -- 10MB
  array['image/png','image/jpeg','image/webp','image/gif','image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 공개 버킷이라 객체는 공개 URL 로 읽힘. 쓰기/삭제는 service role 전용(RLS 우회).
-- anon/authenticated 에는 별도 storage 정책을 부여하지 않는다(업로드는 서버만).
