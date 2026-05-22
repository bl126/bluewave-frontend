const CACHE_KEY = "bw_ton_usd_price";
const CACHE_TTL_MS = 5 * 60 * 1000;
const FALLBACK_TON_USD = 3.0;

type CachedPrice = { price: number; ts: number };

export function getCachedTonPriceUsd(): number {
  if (typeof window === "undefined") return FALLBACK_TON_USD;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return FALLBACK_TON_USD;
    const parsed = JSON.parse(raw) as CachedPrice;
    if (typeof parsed.price === "number" && parsed.price > 0) return parsed.price;
  } catch {
    /* ignore */
  }
  return FALLBACK_TON_USD;
}

export function setCachedTonPriceUsd(price: number): void {
  if (typeof window === "undefined" || !(price > 0)) return;
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ price, ts: Date.now() } satisfies CachedPrice)
    );
  } catch {
    /* ignore */
  }
}

export function isTonPriceCacheFresh(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as CachedPrice;
    return Date.now() - parsed.ts < CACHE_TTL_MS && parsed.price > 0;
  } catch {
    return false;
  }
}

export async function fetchTonPriceUsd(): Promise<number> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd"
    );
    const data = await res.json();
    const price = data["the-open-network"]?.usd;
    if (typeof price === "number" && price > 0) {
      setCachedTonPriceUsd(price);
      return price;
    }
  } catch {
    /* use cache / fallback */
  }
  return getCachedTonPriceUsd();
}

export { FALLBACK_TON_USD };
