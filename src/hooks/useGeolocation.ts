"use client";

import { useCallback, useEffect } from "react";
import { useLocationStore } from "@/stores/useLocationStore";

interface Coords {
  lat: number;
  lng: number;
  accuracy?: number;
  updatedAt: number;
}

/**
 * Imperative GPS fetch. Resolves with fresh coords on success, null on
 * failure. Also syncs the resulting state into useLocationStore.
 */
export function getFreshPosition(): Promise<Coords | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      useLocationStore
        .getState()
        .setError("브라우저가 위치 기능을 지원하지 않아요.");
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: Coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          updatedAt: Date.now(),
        };
        const s = useLocationStore.getState();
        s.setCoords(coords);
        s.setPermission("granted");
        s.setError(null);
        resolve(coords);
      },
      (err) => {
        const s = useLocationStore.getState();
        s.setPermission(err.code === err.PERMISSION_DENIED ? "denied" : "prompt");
        const msg =
          err.code === err.PERMISSION_DENIED
            ? "위치 권한이 필요해요. 브라우저 설정에서 허용해 주세요."
            : err.code === err.TIMEOUT
            ? "GPS 응답이 느려요. 야외에서 다시 시도해 주세요."
            : "현재 위치를 받지 못했어요.";
        s.setError(msg);
        resolve(null);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 },
    );
  });
}

export function useGeolocation() {
  const { coords, permission, error } = useLocationStore();

  const request = useCallback(() => {
    useLocationStore.getState().setPermission("prompt");
    getFreshPosition();
  }, []);

  // Auto-request on first mount if we don't have coords yet.
  useEffect(() => {
    if (!coords && permission === "unknown") {
      request();
    }
  }, [coords, permission, request]);

  return { coords, permission, error, request };
}
