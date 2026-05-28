// [CODE: POST_SHARE_PAGE]
// This is a public server-side page that generates rich Open Graph previews
// for Bluewave posts. Telegram's link crawler visits this URL to extract
// the post snippet (title, description, image) shown in the chat preview.
// Real users are automatically redirected to the mini app via the button.

import type { Metadata } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://bluewave-backend-production.up.railway.app";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://bluewaveprotocol.com";
const TG_BOT = "Bluewave_Ecosystem_bot";
const TG_APP = "bluewave";

interface PostPageProps {
  params: Promise<{ id: string }>;
}

// ── Server-side OG metadata generation ───────────────────────────────────────
export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { id } = await params;

  let title = "Bluewave Signal";
  let description = "View this post on Bluewave — the decentralised social layer for Telegram.";
  let imageUrl = `${APP_URL}/og-default.png`; // fallback OG image

  try {
    // Fetch post without auth (public endpoint for bots/crawlers)
    const res = await fetch(`${API_URL}/api/explore/post/${id}`, {
      next: { revalidate: 60 }, // Cache for 60s to keep previews fresh
    });
    if (res.ok) {
      const post = await res.json();
      const channelTitle = post.channel?.title || post.user?.name || "Bluewave";

      // Title: "ChannelName on Bluewave"
      title = `${channelTitle} on Bluewave`;

      // Description: truncated post content (140 chars for Telegram preview)
      if (post.content) {
        description = post.content.length > 140
          ? post.content.slice(0, 137) + "…"
          : post.content;
      }

      // Image: first media asset if available, else channel photo, else default
      if (post.media_urls?.[0]?.type === "photo") {
        imageUrl = post.media_urls[0].url;
      } else if (post.media_url && post.media_type === "photo") {
        imageUrl = post.media_url;
      } else if (post.channel?.photo) {
        imageUrl = post.channel.photo;
      }
    }
  } catch {
    // Non-fatal — use defaults
  }

  const miniAppUrl = `https://t.me/${TG_BOT}/${TG_APP}?startapp=post_${id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: imageUrl, width: 1200, height: 630 }],
      type: "article",
      siteName: "Bluewave Protocol",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    // Telegram follows the OG standard — no special tag needed beyond og:*
    alternates: {
      canonical: miniAppUrl,
    },
    other: {
      // Tell Telegram to show the mini app directly when the link is tapped
      "telegram:channel": "@Bluewave_Protocol",
    },
  };
}

// ── Page Component (redirect shell for real users) ────────────────────────────
export default async function PostSharePage({ params }: PostPageProps) {
  const { id } = await params;
  const miniAppUrl = `https://t.me/${TG_BOT}/${TG_APP}?startapp=post_${id}`;

  // Fetch minimal post data for the preview card shown to humans
  let channelTitle = "Bluewave Signal";
  let content = "";
  let channelPhoto = "";

  try {
    const res = await fetch(`${API_URL}/api/explore/post/${id}`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const post = await res.json();
      channelTitle = post.channel?.title || post.user?.name || "Bluewave Signal";
      content = post.content || "";
      channelPhoto = post.channel?.photo || post.user?.photo || "";
    }
  } catch {
    // Non-fatal
  }

  const preview = content.length > 200 ? content.slice(0, 197) + "…" : content;

  return (
    <html lang="en">
      <head>
        {/* Instant redirect for Telegram in-app browser */}
        <meta httpEquiv="refresh" content={`0; url=${miniAppUrl}`} />
        <meta name="robots" content="noindex" />
      </head>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Inter', -apple-system, sans-serif",
          padding: "24px",
        }}
      >
        {/* Preview card shown during redirect */}
        <div
          style={{
            maxWidth: 420,
            width: "100%",
            background: "linear-gradient(135deg, #0a1628 0%, #050d1a 100%)",
            borderRadius: 24,
            border: "1px solid rgba(0,230,255,0.15)",
            boxShadow: "0 0 60px rgba(0,230,255,0.08), 0 20px 60px rgba(0,0,0,0.8)",
            overflow: "hidden",
          }}
        >
          {/* Header bar */}
          <div
            style={{
              padding: "20px 24px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            {channelPhoto ? (
              <img
                src={channelPhoto}
                alt={channelTitle}
                style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(0,230,255,0.3)" }}
              />
            ) : (
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "rgba(0,230,255,0.1)",
                  border: "2px solid rgba(0,230,255,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#00e6ff",
                  fontWeight: 900,
                  fontSize: 16,
                }}
              >
                {channelTitle[0]?.toUpperCase() ?? "B"}
              </div>
            )}
            <div>
              <p style={{ margin: 0, color: "#fff", fontWeight: 700, fontSize: 14, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                {channelTitle}
              </p>
              <p style={{ margin: 0, color: "rgba(0,230,255,0.6)", fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" }}>
                BLUEWAVE SIGNAL
              </p>
            </div>
          </div>

          {/* Post content */}
          {preview && (
            <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.85)", fontSize: 15, lineHeight: 1.6 }}>
                {preview}
              </p>
            </div>
          )}

          {/* CTA */}
          <div style={{ padding: "16px 24px 24px", textAlign: "center" }}>
            <p style={{ margin: "0 0 12px", color: "rgba(255,255,255,0.3)", fontSize: 11, letterSpacing: "0.1em" }}>
              OPENING IN BLUEWAVE…
            </p>
            <a
              href={miniAppUrl}
              style={{
                display: "inline-block",
                padding: "12px 28px",
                background: "linear-gradient(135deg, #00e6ff, #0088ff)",
                color: "#000",
                fontWeight: 900,
                fontSize: 12,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                borderRadius: 100,
                textDecoration: "none",
                boxShadow: "0 0 24px rgba(0,230,255,0.4)",
              }}
            >
              Open in Bluewave
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
