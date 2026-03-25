// [CODE: FRONTEND_USE_API_HOOK]
// lib/useApi.ts
"use client";

import useSWR from "swr";
import { fetcher, swrConfig } from "./swrFetcher";

// [CODE: FRONTEND_POST_API_HELPER]
// ⭐ Safer POST helper (handles rate-limits + JSON errors)
export async function postApi(path: string, body: any = {}) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const url = `${apiUrl}/api${path}`;

  const initData = typeof window !== "undefined" ? (window as any).Telegram?.WebApp?.initData : "";

  try {
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

  const initData = typeof window !== "undefined" ? (window as any).Telegram?.WebApp?.initData : "";

  try {
    const res = await fetch(url, {
      headers: {
        "x-telegram-init-data": initData || "",
      },
    });

    const json = await res.json();

    if (!res.ok) {
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
    { ...swrConfig, ...options }
  );

  return {
    data,
    error,
    loading: isLoading,
    mutate,
  };
}