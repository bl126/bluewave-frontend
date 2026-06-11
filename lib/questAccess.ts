/** Quest tab: admin sees live quests; everyone else keeps placeholder UI until public launch. */
export const QUEST_ADMIN_IDS: number[] = [5023869471];
export const QUEST_ADMIN_BW_IDS: string[] = ["BW-IV8-3NZ-SQ8", "BW-74T-D3A-URG"];

export function canAdminQuests(
  telegramUserId: number | string | undefined | null,
  bwId?: string | null
): boolean {
  if (bwId && QUEST_ADMIN_BW_IDS.includes(bwId)) return true;
  if (typeof telegramUserId === "string" && QUEST_ADMIN_BW_IDS.includes(telegramUserId)) return true;
  if (telegramUserId == null || telegramUserId === "") return false;
  const id = Number(telegramUserId);
  if (!Number.isFinite(id)) return false;
  return QUEST_ADMIN_IDS.includes(id);
}
