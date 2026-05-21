/**
 * Open a Telegram user's profile inside the Mini App (chat / view profile).
 * Prefers @username; falls back to tg:// deep link when username is missing.
 */
export function openTelegramProfile(tgId: number, username?: string | null): boolean {
  if (typeof window === "undefined") return false;

  const twa = (window as any).Telegram?.WebApp;
  let link: string | null = null;

  const clean = username?.trim().replace(/^@/, "");
  if (clean && /^[a-zA-Z0-9_]{5,32}$/.test(clean)) {
    link = `https://t.me/${clean}`;
  } else if (tgId > 0) {
    link = `tg://user?id=${tgId}`;
  }

  if (!link) return false;

  try {
    if (twa?.openTelegramLink) {
      twa.openTelegramLink(link);
      return true;
    }
    window.open(link, "_blank");
    return true;
  } catch {
    return false;
  }
}
