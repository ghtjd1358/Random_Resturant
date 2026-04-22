"use client";

import { openDB, type IDBPDatabase } from "idb";
import { DB_NAME, DB_VERSION, type RRSchema } from "./schema";

let dbPromise: Promise<IDBPDatabase<RRSchema>> | null = null;

export function getDB(): Promise<IDBPDatabase<RRSchema>> {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB is only available in the browser.");
  }
  if (!dbPromise) {
    dbPromise = openDB<RRSchema>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        // Each case falls through intentionally to apply subsequent migrations.
        /* eslint-disable no-fallthrough */
        switch (oldVersion) {
          case 0: {
            const visited = db.createObjectStore("visited", {
              keyPath: "placeId",
            });
            visited.createIndex("byVisitedAt", "visitedAt");
            visited.createIndex("byCategory", "category");
            visited.createIndex("byFeedback", "feedback");

            const skipped = db.createObjectStore("skipped", {
              keyPath: "placeId",
            });
            skipped.createIndex("bySkippedAt", "skippedAt");
            skipped.createIndex("byCategory", "category");

            const sessions = db.createObjectStore("sessions", {
              keyPath: "id",
            });
            sessions.createIndex("byStartedAt", "startedAt");
          }
          case 1: {
            // v2: personalization profile store
            db.createObjectStore("profile", { keyPath: "id" });
          }
          // future: case 2: ...
        }
        /* eslint-enable no-fallthrough */
      },
      blocking() {
        // Another tab is trying to upgrade — close this connection so it can.
        dbPromise = null;
      },
      blocked() {
        console.warn("[rr-db] upgrade blocked by another connection");
      },
    });
  }
  return dbPromise;
}
