import "server-only";
import { cacheGet, cacheSet } from "@/lib/cache/runtime";

/**
 * Application-level daily rate limit for upstream API calls.
 *
 * Backed by Vercel Runtime Cache. Counters are per-UTC-day and scoped per
 * bucket name, so different endpoints can have different budgets.
 *
 * This is a cheap, best-effort guardrail — good enough to cap cost spikes on
 * a personal project, not suitable as a hostile abuse defense.
 */

interface Budget {
  /** Max calls per UTC day. */
  perDay: number;
}

const BUDGETS: Record<string, Budget> = {
  "places-nearby": { perDay: 500 },
  "places-details": { perDay: 1000 },
  "ai-reason": { perDay: 200 },
};

function todayKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

export class RateLimitExceeded extends Error {
  resetAtMs: number;
  limit: number;
  constructor(limit: number, resetAtMs: number) {
    super(`Daily rate limit (${limit}) exceeded`);
    this.name = "RateLimitExceeded";
    this.limit = limit;
    this.resetAtMs = resetAtMs;
  }
}

function nextMidnightUtcMs(): number {
  const d = new Date();
  d.setUTCHours(24, 0, 0, 0);
  return d.getTime();
}

/**
 * Increment the counter for a bucket and throw if today's budget is exceeded.
 * Uses a read-then-write pattern that's eventually consistent — a few extra
 * calls can slip through under heavy concurrency, which is fine for our
 * budget-guard use case.
 */
export async function consumeDailyQuota(
  bucket: keyof typeof BUDGETS,
): Promise<void> {
  const budget = BUDGETS[bucket];
  if (!budget) return;

  const key = `ratelimit:${bucket}:${todayKey()}`;
  // Store the counter for 25h to comfortably cover the UTC rollover.
  const ttlSeconds = 60 * 60 * 25;

  const current = (await cacheGet<number>(key)) ?? 0;
  if (current >= budget.perDay) {
    throw new RateLimitExceeded(budget.perDay, nextMidnightUtcMs());
  }

  await cacheSet(key, current + 1, { ttl: ttlSeconds });
}
