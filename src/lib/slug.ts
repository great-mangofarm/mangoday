/** 제목 → URL slug. 한글 등 유니코드 글자는 보존(URL 인코딩으로 안전). */
export function slugify(input: string): string {
  return input
    .normalize("NFC")
    .trim()
    .toLowerCase()
    .replace(/[\s/]+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
