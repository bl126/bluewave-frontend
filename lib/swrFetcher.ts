// [CODE: FRONTEND_SWR_FETCHER]
// lib/swrFetcher.ts
import { cacheManager, CACHE_TTL } from "./cacheManager";

export const fetcher = async (url: string) => {
  // ⭐ Try to get from localStorage cache first (for stable data)
  const cacheKey = new URL(url).pathname + new URL(url).search;

  if (url.includes("/countries") || url.includes("/leaderboard") || url.includes("/user/")) {
    const cached = cacheManager.get(cacheKey);
    if (cached) {
      console.log("📦 Cache hit:", cacheKey);
      return cached;
    }
  }

  // Fetch from network (use standard HTTP caching, not no-cache)
  const initData = typeof window !== "undefined" ? (window as any).Telegram?.WebApp?.initData : "";

  const res = await fetch(url, {
    headers: {
      "x-telegram-init-data": initData || "",
    },
  });

  if (!res.ok) {
    const err: any = new Error("API error");
    err.status = res.status;
    throw err;
  }

  const data = await res.json();

  // ⭐ Cache stable data in localStorage
  if (url.includes("/countries")) {
    cacheManager.set(cacheKey, data, CACHE_TTL.COUNTRIES);
  } else if (url.includes("/leaderboard")) {
    cacheManager.set(cacheKey, data, CACHE_TTL.LEADERBOARD);
  } else if (url.includes("/user/")) {
    cacheManager.set(cacheKey, data, CACHE_TTL.USER_PROFILE);
  }

  return data;
};

// ⭐ SWR configuration for optimal performance
export const swrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 2000, // Don't fetch same URL within 2 seconds
  focusThrottleInterval: 300000, // 5 minutes between window focus revalidates
  errorRetryCount: 2,
  errorRetryInterval: 3000,
} as const;

