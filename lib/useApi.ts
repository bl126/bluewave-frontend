// lib/useApi.ts
"use client";

import useSWR from "swr";
import { fetcher } from "./swrFetcher";

export function useApi(path: string | null) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const { data, error, isLoading } = useSWR(
    path && apiUrl ? `${apiUrl}/api${path}` : null,  // SWR: null = don't fetch
    fetcher
  );

  return {
    data,
    error,
    loading: isLoading,
  };
}
