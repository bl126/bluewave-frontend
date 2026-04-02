// [CODE: FRONTEND_SWR_FETCHER]
// lib/swrFetcher.ts
import { cacheManager, CACHE_TTL } from "./cacheManager";
import { isSessionExpired, setSessionExpired } from "./session";

export const fetcher = async (url: string) => {
  // 🛡️ Guard to prevent "burning" the API
  if (isSessionExpired()) {
    console.warn(`🛑 SWR Fetch Blocked (Session Expired): ${url}`);
    throw new Error("AUTH_EXPIRED");
  }

  // ⭐ Try to get from localStorage cache first (only for truly stable, rarely-changing data)
  const cacheKey = new URL(url).pathname + new URL(url).search;

  // Only cache countries and leaderboard — user profile should always be fresh from SWR in-memory
  if (url.includes("/countries") || url.includes("/leaderboard")) {
    const cached = cacheManager.get(cacheKey);
    if (cached) {
      console.log("📦 Cache hit:", cacheKey);
      return cached;
    }
  }

  // Fetch from network
  const initData = typeof window !== "undefined" ? (window as any).Telegram?.WebApp?.initData : "";

  const res = await fetch(url, {
    headers: {
      "x-telegram-init-data": initData || "",
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      setSessionExpired();
    }
    const err: any = new Error("API error");
    err.status = res.status;
    throw err;
  }

  const data = await res.json();

  // ⭐ Cache only stable, rarely-changing data in localStorage
  // User profile is intentionally excluded — served fresh from SWR in-memory
  if (url.includes("/countries")) {
    cacheManager.set(cacheKey, data, CACHE_TTL.COUNTRIES);
  } else if (url.includes("/leaderboard")) {
    cacheManager.set(cacheKey, data, CACHE_TTL.LEADERBOARD);
  }

  return data;
};

// ⭐ SWR configuration for optimal performance
export const swrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 2000,
  focusThrottleInterval: 15000, // Reduced from 5min — returning to app now triggers quick refresh
  errorRetryCount: 2,
  errorRetryInterval: 3000,
} as const;
