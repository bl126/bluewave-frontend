const CACHE_KEY = "bw_star_withdrawal_info";
const CACHE_TTL_MS = 2 * 60 * 1000;

export type StarWithdrawalInfo = {
  stars_balance: number;
  stars_withdrawable: number;
  ledger_withdrawable: number;
  effective_withdrawable: number;
  stars_on_hold: number;
  gift_hold_days: number;
  min_withdrawal_stars: number;
  star_usd_rate: number;
  ton_price_usd: number;
  star_ton_rate: number;
  wallet_address: string;
  ts: number;
};

type Stored = StarWithdrawalInfo & { tg_id: number };

function readAll(): Record<string, Stored> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, Stored>;
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, Stored>) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function getCachedStarWithdrawalInfo(tgId: number): StarWithdrawalInfo | null {
  const entry = readAll()[String(tgId)];
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) return null;
  const { tg_id: _tg, ts, ...info } = entry;
  return { ...info, ts };
}

export function setCachedStarWithdrawalInfo(tgId: number, res: Record<string, unknown>) {
  if (!tgId || res?.error) return;
  const tonPrice = Number(res.ton_price_usd ?? 0);
  const starUsd = Number(res.star_usd_rate ?? 0.009);
  const stored: Stored = {
    tg_id: tgId,
    ts: Date.now(),
    stars_balance: Number(res.stars_balance ?? 0),
    stars_withdrawable: Number(res.stars_withdrawable ?? 0),
    ledger_withdrawable: Number(res.ledger_withdrawable ?? 0),
    effective_withdrawable: Number(
      res.effective_withdrawable ?? res.stars_withdrawable ?? 0
    ),
    stars_on_hold: Number(res.stars_on_hold ?? 0),
    gift_hold_days: Number(res.gift_hold_days ?? 3),
    min_withdrawal_stars: Number(res.min_withdrawal_stars ?? 1000),
    star_usd_rate: starUsd,
    ton_price_usd: tonPrice,
    star_ton_rate: Number(
      res.star_ton_rate ??
        (tonPrice > 0 ? starUsd / tonPrice : 0)
    ),
    wallet_address: String(res.wallet_address ?? ""),
  };
  const all = readAll();
  all[String(tgId)] = stored;
  writeAll(all);
}

export function seedFromTelegramUser(
  tgId: number,
  user: Record<string, unknown> | null | undefined
): StarWithdrawalInfo | null {
  if (!tgId || !user) return null;
  const existing = getCachedStarWithdrawalInfo(tgId);
  if (existing) return existing;
  return {
    stars_balance: Number(user.stars_balance ?? 0),
    stars_withdrawable: Number(user.stars_withdrawable ?? 0),
    ledger_withdrawable: Number(user.stars_withdrawable ?? 0),
    effective_withdrawable: Number(user.stars_withdrawable ?? 0),
    stars_on_hold: 0,
    gift_hold_days: 3,
    min_withdrawal_stars: 1000,
    star_usd_rate: 0.009,
    ton_price_usd: 0,
    star_ton_rate: 0,
    wallet_address: String(user.wallet_address ?? ""),
    ts: 0,
  };
}
