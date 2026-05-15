import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import BackgroundAmbience from "@/components/ui/BackgroundAmbience";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bluewave Protocol",
  description: "Bluewave Ecosystem Mini App",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        {/* Full viewport on all devices */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        
        {/* ⚡ THEME BLOCKING SCRIPT: Prevents "flash" of wrong theme on load */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var theme = localStorage.getItem('bw_theme');
              if (theme !== 'dim' && theme !== 'original') theme = 'original'; // Default to high-contrast night
              document.documentElement.setAttribute('data-theme', theme);
              if (theme === 'dim') document.body.style.backgroundColor = '#17212B';
              else document.body.style.backgroundColor = '#000000';
            } catch (e) {}
          })();
        `}} />

        {/* 🌍 GLOBE TEXTURE PRELOADING: Local assets — no CDN dependency */}
        <link rel="preload" href="/textures/earth-blue-marble.jpg" as="image" />
        <link rel="preload" href="/textures/earth-night.jpg" as="image" />
        <link rel="preload" href="/textures/earth-clouds.png" as="image" />
        
        {/* 🎨 LOGO PRELOADING: Prevent branding flicker */}
        <link rel="preload" href="/bluewave_logo.png" as="image" />
        <link rel="preload" href="/logo-bluewave.png" as="image" />

        {/* 🤖 BLU AGENT & COCOON: Preload for instant display */}
        <link rel="preload" href="/blu_image.png" as="image" />
        <link rel="preload" href="/cocoon_egg.png" as="image" />

        {/* Telegram Mini App SDK — must be first */}
        <script src="https://telegram.org/js/telegram-web-app.js"></script>
      </head>
      <body className="h-full overflow-hidden bg-black selection:bg-cyan-500/30 touch-none overscroll-none transition-colors duration-300">
        <Providers>
          <BackgroundAmbience />
          {children}
        </Providers>
      </body>
    </html>
  );
}
