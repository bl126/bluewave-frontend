/** Quest tab: admin sees live quests; everyone else keeps placeholder UI until public launch. */
export const QUEST_ADMIN_IDS: number[] = [5023869471];

export function canAdminQuests(telegramUserId: number | string | undefined | null): boolean {
  if (telegramUserId == null || telegramUserId === "") return false;
  const id = Number(telegramUserId);
  if (!Number.isFinite(id)) return false;
  return QUEST_ADMIN_IDS.includes(id);
}
