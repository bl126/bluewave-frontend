"use client";

import { SWRConfig } from "swr";
import { fetcher } from "@/lib/swrFetcher";

import { LanguageProvider } from "@/contexts/LanguageContext";
import { TonConnectUIProvider } from "@tonconnect/ui-react";

// Note: window.open is patched at the HTML level in layout.tsx to intercept
// TON Connect wallet deep-links and route them through Telegram.WebApp.openLink().

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <TonConnectUIProvider
        manifestUrl="https://miniapp.bluewaveprotocol.xyz/tonconnect-manifest.json"
        actionsConfiguration={{
          twaReturnUrl: "https://t.me/Bluewave_Ecosystem_bot/miniapp",
          returnStrategy: "back"
        }}
      >
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
      </TonConnectUIProvider>
    </LanguageProvider>
  );
}
