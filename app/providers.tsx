"use client";

import { SWRConfig } from "swr";
import { fetcher } from "@/lib/swrFetcher";
import { useEffect } from "react";

import { LanguageProvider } from "@/contexts/LanguageContext";
import { TonConnectUIProvider } from "@tonconnect/ui-react";

/**
 * Intercept all anchor clicks inside the TON Connect modal and route them
 * through Telegram's native link-opener. Without this, Telegram Mini App
 * silently blocks window.open() calls for external wallet deep-links,
 * so clicking Tonkeeper / MyTonWallet / Wallet-in-Telegram does nothing.
 */
function TonConnectLinkInterceptor() {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Walk up from the click target to find a parent <a> tag
      const anchor = target.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Only intercept links that are clearly wallet deep-links or TON Connect links
      const isWalletLink =
        href.startsWith("https://") ||
        href.startsWith("http://") ||
        href.startsWith("tg://") ||
        href.startsWith("tonkeeper://") ||
        href.startsWith("mytonwallet://") ||
        href.startsWith("ton://");

      if (!isWalletLink) return;

      const tg = (window as any).Telegram?.WebApp;
      if (!tg) return; // Not in Telegram, let default behavior happen

      e.preventDefault();
      e.stopPropagation();

      // t.me links (like Wallet in Telegram) → openTelegramLink
      if (href.startsWith("https://t.me/") || href.startsWith("tg://")) {
        try {
          tg.openTelegramLink(href);
        } catch {
          tg.openLink(href);
        }
      } else {
        // All other wallet universal links (Tonkeeper, MyTonWallet, etc.)
        tg.openLink(href, { try_instant_view: false });
      }
    };

    // Capture phase so we catch it before the modal's own handlers
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  return null;
}

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
        <TonConnectLinkInterceptor />
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
