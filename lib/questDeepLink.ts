const TG_BOT = "Bluewave_Ecosystem_bot";
const TG_APP = "bluewave";

export function buildQuestStartappLink(slug: string) {
  return `https://t.me/${TG_BOT}/${TG_APP}?startapp=quest_${slug}`;
}

export function parseQuestSlugFromStartParam(startParam: string | undefined | null): string | null {
  if (!startParam || !startParam.startsWith("quest_")) return null;
  const slug = startParam.slice("quest_".length);
  return slug.length > 0 ? slug : null;
}
