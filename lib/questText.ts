export const QUEST_DETAILS_PREVIEW_WORDS = 50;

export function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function truncateWords(text: string, max: number) {
  const words = text.trim().split(/\s+/);
  if (words.length <= max) return text.trim();
  return words.slice(0, max).join(" ");
}

export function questDetailsPreview(text: string, maxWords = QUEST_DETAILS_PREVIEW_WORDS) {
  const full = text.trim();
  const count = wordCount(full);
  if (count <= maxWords) {
    return { short: full, has_more: false };
  }
  return { short: truncateWords(full, maxWords), has_more: true };
}
