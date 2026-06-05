"use client";

import { useEffect, useState } from "react";

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlB64ToUint8Array(base64: string): Uint8Array {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + pad).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function PushControls() {
  const [supported, setSupported] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      Promise.resolve().then(() => setSupported(false));
      return;
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(!!sub))
      .catch(() => {});
  }, []);

  async function enable() {
    setBusy(true);
    setMsg(null);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setMsg("알림 권한이 거부됐어요. 브라우저 설정에서 허용해 주세요.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(VAPID) as unknown as BufferSource,
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) throw new Error();
      setSubscribed(true);
      setMsg("알림을 켰어요. 아래 '테스트 알림'으로 확인해 보세요.");
    } catch {
      setMsg("구독에 실패했어요.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setMsg(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
      setMsg("알림을 껐어요.");
    } catch {
      setMsg("해제에 실패했어요.");
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/push/test", { method: "POST" });
      const j = (await res.json()) as { sent: number; total: number };
      setMsg(`발송 완료: ${j.sent}/${j.total}대`);
    } catch {
      setMsg("테스트 발송 실패");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">알림 (웹푸시)</h2>
          <p className="mt-0.5 text-xs text-muted">
            {!supported
              ? "이 브라우저는 푸시를 지원하지 않아요."
              : subscribed
                ? "이 기기에서 알림을 받는 중이에요."
                : "일정 알림을 이 기기로 받으려면 켜세요."}
          </p>
        </div>
        <div className="flex gap-2">
          {supported && !subscribed && (
            <button
              onClick={enable}
              disabled={busy}
              className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-50"
            >
              알림 켜기
            </button>
          )}
          {supported && subscribed && (
            <>
              <button
                onClick={test}
                disabled={busy}
                className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-surface disabled:opacity-50"
              >
                테스트 알림
              </button>
              <button
                onClick={disable}
                disabled={busy}
                className="rounded-lg border border-border px-3 py-2 text-sm text-muted hover:bg-surface disabled:opacity-50"
              >
                끄기
              </button>
            </>
          )}
        </div>
      </div>
      {msg && <p className="mt-2 text-sm text-primary-700">{msg}</p>}
    </div>
  );
}
