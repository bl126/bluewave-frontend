"use client";

import { SWRConfig } from "swr";
import { fetcher } from "@/lib/swrFetcher";


export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        dedupingInterval: 3000,
        revalidateOnFocus: false,
        shouldRetryOnError: true,
        errorRetryInterval: 5000,
      }}
    >
      {children}
    </SWRConfig>
  );
}
