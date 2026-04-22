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

  return { goMap, reroll: rerollHaptic, markGood, markBad, skip };
}
