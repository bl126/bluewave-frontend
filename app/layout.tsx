import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

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

        {/* 🌍 GLOBE TEXTURE PRELOADING: Only load textures actually used by BluewaveGlobe.tsx */}
        {/* earth-night.jpg (715KB) is the ONLY texture used — both day+night slots use it */}
        <link rel="preload" href="/textures/earth-night.jpg" as="image" />
        <link rel="preload" href="/textures/earth-clouds.png" as="image" />
        {/* ⚠️ earth-blue-marble.jpg removed — it is NOT referenced in code (saves 1.4MB) */}

        {/* 🎨 LOGO PRELOADING: Prevent branding flicker */}
        <link rel="preload" href="/bluewave_logo.png" as="image" />
        <link rel="preload" href="/logo-bluewave.png" as="image" />

        {/* 🤖 BLU AGENT & COCOON: Lazy-load via <img> when overlays open (saves 12MB on startup) */}
        {/* blu_image.webp and cocoon_egg.webp are now optimized WebP, loaded on-demand */}

        {/* Telegram Mini App SDK — must be first */}
        <script src="https://telegram.org/js/telegram-web-app.js"></script>
      </head>
      <body className="h-full overflow-hidden bg-black selection:bg-cyan-500/30 touch-none overscroll-none transition-colors duration-300">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
