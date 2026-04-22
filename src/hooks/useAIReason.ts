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

  useEffect(() => {
    if (!placeId) {
      setState({ reason: null, status: "loading" });
      return;
    }

    let cancelled = false;
    setState({ reason: null, status: "loading" });

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
