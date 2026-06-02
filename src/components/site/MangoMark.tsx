/** 망고색 라운드 사각형 + 흰 망고. 헤더/PWA 등에서 재사용. */
export function MangoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="mangoday"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="64" height="64" rx="14" fill="#f59e0b" />
      <path
        d="M40 19C29 15 17 21 14 33c-3 12 5 21 16 22 12 1 20-8 21-19 1-9-3-13-11-17z"
        fill="#ffffff"
      />
      <path
        d="M41 15c1-5 5-9 12-10-1 6-5 11-11 12-1 0-2-1-1-2z"
        fill="#ffffff"
      />
    </svg>
  );
}
