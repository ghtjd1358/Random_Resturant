"use client";

import { useEffect, useState } from "react";

type Status = "loading" | "ready" | "error";

interface AIReasonState {
  reason: string | null;
  status: Status;
}

/**
 * Fetches the AI-generated one-liner for a place. Re-runs when placeId
 * changes and cancels in-flight requests on unmount / placeId swap.
 */
export function useAIReason(placeId: string | null | undefined): AIReasonState {
  const [state, setState] = useState<AIReasonState>({
    reason: null,
    status: "loading",
  });

  // Reset to loading on placeId change — done during render via the
  // "Adjusting state when a prop changes" pattern from React 19 docs so
  // the lint rule (set-state-in-effect) stays happy. The effect below
  // handles the async fetch; its setState calls fire on a microtask
  // (.then) which is allowed.
  const [prevPlaceId, setPrevPlaceId] = useState<typeof placeId>(placeId);
  if (prevPlaceId !== placeId) {
    setPrevPlaceId(placeId);
    setState({ reason: null, status: "loading" });
  }

  useEffect(() => {
    if (!placeId) return;

    let cancelled = false;
    const ctrl = new AbortController();
    fetch("/api/ai/reason", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeId }),
      signal: ctrl.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { reason: string };
        if (!cancelled) setState({ reason: data.reason, status: "ready" });
      })
      .catch((err) => {
        if (cancelled || err.name === "AbortError") return;
        setState({ reason: null, status: "error" });
      });

    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [placeId]);

  return state;
}
