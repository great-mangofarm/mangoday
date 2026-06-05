"use client";

import { useEffect } from "react";

/** 서비스워커 등록 (PWA + 푸시). 루트 레이아웃에 마운트. */
export function RegisterSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
