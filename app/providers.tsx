// [CODE: FRONTEND_PROVIDERS_WITH_SESSION_EXPRY]
// app/providers.tsx
"use client";

import { useEffect, useState } from "react";
import { SWRConfig } from "swr";
import { fetcher } from "@/lib/swrFetcher";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { subscribeToSessionExpiry } from "@/lib/session";
import SessionExpiredOverlay from "@/components/ui/SessionExpiredOverlay";
import MaintenanceOverlay from "@/components/ui/MaintenanceOverlay"; // Reference for parity

export function Providers({ children }: { children: React.ReactNode }) {
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  useEffect(() => {
    // 🛡️ Listen for global session expiry events (triggered by API helpers)
    const unsubscribe = subscribeToSessionExpiry((expired) => {
      setIsSessionExpired(expired);
    });

    return () => unsubscribe();
  }, []);

  return (
    <ThemeProvider>
      <LanguageProvider>
        <TonConnectUIProvider
        manifestUrl="https://miniapp.bluewaveprotocol.xyz/tonconnect-manifest.json"
        actionsConfiguration={{
          twaReturnUrl: "https://t.me/Bluewave_Ecosystem_bot",
          returnStrategy: 'back'
        }}
      >
        <SWRConfig
          value={{
            fetcher,
            dedupingInterval: 3000,
            revalidateOnFocus: false,
            shouldRetryOnError: (err) => {
              // 🛑 STOP retrying if session is expired
              if (err.message === "AUTH_EXPIRED" || isSessionExpired) return false;
              return true;
            },
            errorRetryInterval: 5000,
          }}
        >
          {/* If session is expired, show the un-dismissible overlay instead of the app */}
          {isSessionExpired ? (
            <SessionExpiredOverlay />
          ) : (
            children
          )}
        </SWRConfig>
      </TonConnectUIProvider>
    </LanguageProvider>
  </ThemeProvider>
);
}
