// [CODE: FRONTEND_USE_API_HOOK]
// lib/useApi.ts
"use client";

import useSWR from "swr";
import { fetcher, swrConfig, waitForInitData } from "./swrFetcher";
import { isSessionExpired, setSessionExpired } from "./session";

// [CODE: FRONTEND_POST_API_HELPER]
// ⭐ Safer POST helper (handles rate-limits + JSON errors)
export async function postApi(path: string, body: any = {}) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const url = `${apiUrl}/api${path}`;

  const initData = await waitForInitData();

  // 🛡️ Guard to prevent "burning" the API
  if (isSessionExpired()) {
    console.warn(`🛑 API Call Blocked (Session Expired): ${path}`);
    return { error: "AUTH_EXPIRED" };
  }

  try {
    // 🛡️ Guard to prevent 401 lockdown if SDK is missing
    if (!initData && typeof window !== "undefined") {
      console.warn(`⚠️ Skipping POST ${path}: SDK_NOT_READY`);
      return { error: "SDK_NOT_READY" };
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-telegram-init-data": initData || "",
      },
      body: JSON.stringify(body),
    });

    const json = await res.json();

    if (!res.ok) {
      if (res.status === 401) {
        // 🔒 [CRITICAL_ACTION]
        // Manual POST actions still trigger the lockout for high-integrity intent.
        setSessionExpired();
      }
      throw new Error(json.detail || json.message || "API_ERROR");
    }

    return json;
  } catch (err: any) {
    return { error: err.message || "NETWORK_ERROR" };
  }
}

// [CODE: FRONTEND_GET_API_HELPER]
// ⭐ Safer GET helper (for manual fetches)
export async function getApi(path: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const url = `${apiUrl}/api${path}`;

  const initData = await waitForInitData();

  // 🛡️ Guard to prevent "burning" the API
  if (isSessionExpired()) {
    console.warn(`🛑 API Call Blocked (Session Expired): ${path}`);
    return { error: "AUTH_EXPIRED" };
  }

  try {
    // 🛡️ Guard to prevent 401 lockdown if SDK is missing
    if (!initData && typeof window !== "undefined") {
      console.warn(`⚠️ Skipping GET ${path}: SDK_NOT_READY`);
      return { error: "SDK_NOT_READY" };
    }

    const res = await fetch(url, {
      headers: {
        "x-telegram-init-data": initData || "",
      },
    });

    const json = await res.json();

    if (!res.ok) {
      if (res.status === 401) {
        // 🛡️ [SEAMLESS_AUTH]
        // Manual GET fetches (profiles/missions) fail silenty.
        // The app WON'T lock down.
        console.warn(`🔄 GET Auth Fail (Silent): ${path}`);
      }
      throw new Error(json.detail || json.message || "API_ERROR");
    }

    return json;
  } catch (err: any) {
    return { error: err.message || "NETWORK_ERROR" };
  }
}

// =============================================
// 🔥 PREBUILT BLUEWAVE HELPERS
// =============================================

// GET /user/{tg_id}
export function getUserProfile(tg_id: number) {
  return getApi(`/user/${tg_id}`);
}

// GET /balance/{tg_id}
export function getBalance(tg_id: number) {
  return getApi(`/balance/${tg_id}`);
}

// GET missions
export function getMissions(tg_id: number) {
  return getApi(`/missions/${tg_id}`);
}

// POST claim mission
export function claimMission(telegram_id: number, mission_id: string) {
  return postApi(`/claim_mission`, { telegram_id, mission_id });
}

// POST claim referral earnings
export function claimReferral(telegram_id: number) {
  return postApi(`/claim_referral`, { telegram_id });
}

// POST notify inactive referrals
export function notifyInactive(telegram_id: number) {
  return postApi(`/notify_inactive`, { telegram_id });
}

export function useApi(path: string | null, options: any = {}) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const { data, error, isLoading, mutate } = useSWR(
    path && apiUrl ? `${apiUrl}/api${path}` : null,
    fetcher,
    { 
      ...swrConfig, 
      dedupingInterval: 2000, // 2s deduping — allows mutate() to take effect immediately
      revalidateOnFocus: true, // Refresh when user returns to the app tab
      ...options 
    }
  );

  return {
    data,
    error,
    loading: isLoading,
    mutate,
  };
}

// ⭐ NEW: Consolidated Sync Hook
export function useSync(tg_id: number | null) {
  return useApi(tg_id ? `/sync/${tg_id}` : null, {
    refreshInterval: 15000, // Heartbeat every 15s (was 45s) — near real-time balance/notifications
    revalidateOnFocus: true, // Immediately sync when user returns to app
    dedupingInterval: 5000,  // Allow sync even if called more frequently (focus re-enter)
  });
}