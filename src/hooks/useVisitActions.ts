"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import {
  deleteVisited,
  markVisited,
  skipPlace,
  unskipPlace,
} from "@/lib/db/repo";
import { haptic } from "@/lib/haptic";
import { useFiltersStore } from "@/stores/useFiltersStore";
import { useSessionStore } from "@/stores/useSessionStore";
import { useRoll } from "@/hooks/useRoll";
import type { PlaceLite } from "@/lib/places/types";

/**
 * Encapsulates the side-effects the PickCard's action buttons trigger:
 * haptic feedback, IndexedDB writes, toast messages, session cleanup.
 * Keeps ActionBar purely presentational.
 */
export function useVisitActions(place: PlaceLite) {
  const { rollAndReveal } = useRoll();
  const setCurrentPick = useSessionStore((s) => s.setCurrentPick);
  const category = useFiltersStore((s) => s.category);

  const goMap = useCallback(() => {
    haptic.tap();
    if (place.googleMapsUri) window.open(place.googleMapsUri, "_blank");
  }, [place.googleMapsUri]);

  const rerollHaptic = useCallback(() => {
    haptic.tap();
    rollAndReveal();
  }, [rollAndReveal]);

  const markGood = useCallback(async () => {
    haptic.positive();
    try {
      await markVisited(place, "good", category);
    } catch {
      toast.error("기록 저장에 실패했어요.");
      return;
    }
    toast.success("좋았어요 👍 기록했어요", {
      description: `${place.name} · 방문 기록에 저장`,
      duration: 3500,
    });
    setCurrentPick(null);
  }, [place, category, setCurrentPick]);

  const markBad = useCallback(async () => {
    haptic.negative();
    try {
      await markVisited(place, "bad", category);
    } catch {
      toast.error("기록 저장에 실패했어요.");
      return;
    }
    toast("별로였어요 👎 기록했어요", {
      description: "방문 기록에 남았고, 다시는 뽑기에 안 나와요.",
      action: {
        label: "되돌리기",
        onClick: async () => {
          await Promise.all([unskipPlace(place.id), deleteVisited(place.id)]);
          toast.success("되돌렸어요.");
        },
      },
      duration: 5000,
    });
    setCurrentPick(null);
  }, [place, category, setCurrentPick]);

  const share = useCallback(async () => {
    haptic.tap();
    const url = place.googleMapsUri ?? "";
    const text = `여기맞아? 가 뽑아줬어 — ${place.name}${
      place.rating ? ` (⭐${place.rating})` : ""
    }`;

    // Prefer native share sheet on supporting platforms (mobile, Edge, Safari).
    // Fallback to clipboard on desktop Chrome/Firefox which lack navigator.share.
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: place.name, text, url: url || undefined });
        return;
      } catch (err) {
        // User dismissed the share sheet — silently succeed.
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard && url) {
      try {
        await navigator.clipboard.writeText(url);
        toast.success("링크를 복사했어요.", {
          description: "원하는 곳에 붙여넣기 하세요.",
        });
        return;
      } catch {
        /* fall through to error toast */
      }
    }
    toast.error("공유를 지원하지 않는 환경이에요.");
  }, [place]);

  const skip = useCallback(async () => {
    haptic.tap();
    try {
      await skipPlace(place, category);
    } catch {
      toast.error("스킵 저장에 실패했어요.");
      return;
    }
    toast("스킵했어요", {
      description: "방문 기록엔 남지 않아요. 다시는 뽑기에 안 나와요.",
      action: {
        label: "되돌리기",
        onClick: async () => {
          await unskipPlace(place.id);
          toast.success("다시 후보로 돌려놨어요.");
        },
      },
      duration: 5000,
    });
    setCurrentPick(null);
    rollAndReveal();
  }, [place, category, setCurrentPick, rollAndReveal]);

  return { goMap, reroll: rerollHaptic, markGood, markBad, skip, share };
}
