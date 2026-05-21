/** Who can use Explore feed, post, and gift Stars during beta. */
export const EXPLORE_ADMIN_IDS: number[] = [5023869471];

export const EXPLORE_BETA_TESTER_IDS: number[] = [
  8531164706,
  2008138868,
  769579042,
  5511825370,
  1504247376,
  5364551821,
  7834249676,
];

export function hasExploreBetaAccess(telegramUserId: number | string | undefined | null): boolean {
  if (telegramUserId == null || telegramUserId === "") return false;
  const id = Number(telegramUserId);
  if (!Number.isFinite(id)) return false;
  return EXPLORE_ADMIN_IDS.includes(id) || EXPLORE_BETA_TESTER_IDS.includes(id);
}
