// [CODE: FRONTEND_SWR_FETCHER]
// lib/swrFetcher.ts
import { cacheManager, CACHE_TTL } from "./cacheManager";
import { isSessionExpired, setSessionExpired } from "./session";

/**
 * ⭐ SILENT RETRY: Wait for Telegram SDK to provide initData.
 * Prevents 401 Unauthorized errors when the app reopens from the background.
 */
export async function waitForInitData(): Promise<string> {
  if (typeof window === "undefined") return "";
  
  let initData = (window as any).Telegram?.WebApp?.initData || "";
  if (initData) return initData;

  console.log("🕒 SDK not ready, waiting for initData...");
  for (let i = 0; i < 20; i++) { // 2 seconds max
    await new Promise(r => setTimeout(r, 100));
    initData = (window as any).Telegram?.WebApp?.initData || "";
    if (initData) {
      console.log("✅ initData ready after delay");
      return initData;
    }
  }
  
  console.warn("⚠️ SDK failed to provide initData after timeout.");
  return "";
}

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
  const initData = await waitForInitData();

  // Final check - if STILL no initData, we must bail to avoid triggering a 401 lockdown
  if (!initData && typeof window !== "undefined") {
    console.warn("⚠️ Skipping sync: SDK_NOT_READY");
    throw new Error("SDK_NOT_READY");
  }

  const res = await fetch(url, {
    headers: {
      "x-telegram-init-data": initData || "",
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      // 🛡️ [SEAMLESS_AUTH]
      // Only lock the session for high-integrity manual actions (POST).
      // Background syncs or informational GETs should fail SILENTLY to avoid UX stress.
      const isCritical = !url.includes("/sync/") && !url.includes("/balance/") && !url.includes("/missions/");
      
      if (isCritical) {
        setSessionExpired();
      } else {
        console.warn(`🔄 Background Auth Fail (Silent): ${url}`);
      }
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
