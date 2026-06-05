import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "mangoday",
    short_name: "mangoday",
    description: "블로그 · 주식/운동 일지 · 캘린더를 한 곳에서",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#f59e0b",
    lang: "ko",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
