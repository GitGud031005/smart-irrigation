import { useEffect, useRef, useState } from "react";

const INITIAL_DELAY_MS = 1_000;  // 1 s
const MAX_DELAY_MS     = 30_000; // 30 s

/**
 * Connects to an SSE endpoint and automatically reconnects with exponential
 * backoff whenever the connection closes (e.g. Vercel serverless 60-s timeout).
 *
 * @param url        SSE endpoint URL, or null to stay disconnected.
 * @param onMessage  Called for every MessageEvent received.
 * @returns          `connected` — true while the EventSource readyState is OPEN.
 */
export function useSSE(
  url: string | null,
  onMessage: (event: MessageEvent) => void,
): { connected: boolean } {
  const [connected, setConnected] = useState(false);

  // Always keep a stable ref to the latest callback so the effect closure
  // never goes stale (no need to add onMessage to the effect dependency array).
  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onMessageRef.current = onMessage;
  }); // intentionally no deps — runs after every render

  useEffect(() => {
    // When url is null, the cleanup from the previous run already sets
    // connected=false; no synchronous setState needed here.
    if (!url) return;

    const effectUrl: string = url; // narrowed to string for use inside connect()
    let source: EventSource | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let delay = INITIAL_DELAY_MS;
    let alive = true;

    function connect() {
      if (!alive) return;
      source = new EventSource(effectUrl);

      source.onopen = () => {
        if (!alive) { source?.close(); return; }
        setConnected(true);
        delay = INITIAL_DELAY_MS; // reset backoff on successful open
      };

      source.onmessage = (event) => {
        if (alive) onMessageRef.current(event);
      };

      source.onerror = () => {
        if (!alive) return;
        setConnected(false);
        source?.close();
        source = null;
        // Exponential backoff: 1 s → 2 s → 4 s → … → 30 s
        timer = setTimeout(() => {
          delay = Math.min(delay * 2, MAX_DELAY_MS);
          connect();
        }, delay);
      };
    }

    connect();

    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
      source?.close();
      setConnected(false);
    };
  }, [url]); // reconnect only when the URL itself changes

  return { connected };
}
