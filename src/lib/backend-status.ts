import { useEffect, useState } from 'react';

const APP_ID = import.meta.env.VITE_COMPUTERAIL_APP_ID as string | undefined;
const STATUS_URL =
  (import.meta.env.VITE_COMPUTERAIL_STATUS_URL as string | undefined) ||
  'https://computerail.co/api/vibe-coding/status';
const POLL_MS = 5000;

export function useBackendReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!APP_ID) { setReady(true); return; }
    if (ready) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function poll() {
      try {
        const res = await fetch(`${STATUS_URL}?id=${encodeURIComponent(APP_ID!)}`);
        const json = await res.json().catch(() => ({}));
        if (!cancelled && json.ready) { setReady(true); return; }
      } catch {
        // network hiccup on the status check itself — retry next tick
      }
      if (!cancelled) timer = setTimeout(poll, POLL_MS);
    }
    poll();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [ready]);
  return ready;
}
