import { getApi, postApi } from "./useApi";

export type QuestFilter = "waves" | "active" | "ended";

export interface QuestCounter {
  type?: string;
  label?: string;
  current?: number;
  max?: number;
  days?: number;
  display?: string;
}

export interface QuestListItem {
  id: string;
  slug: string;
  category: string;
  title: string;
  summary?: string;
  details?: string;
  image_url?: string;
  host_name?: string;
  host_logo_url?: string;
  host_verified: boolean;
  status: string;
  wave?: number;
  started_at?: string;
  ends_at?: string;
  criteria_json?: Record<string, unknown>;
  counter_config?: Record<string, unknown>;
  nft_tier?: number;
  minted_count?: number;
  counter?: QuestCounter;
  details_preview?: { short: string; has_more: boolean; full_word_count?: number };
}

export interface QuestCriterionCheck {
  id: string;
  label?: string;
  done?: boolean;
  detail?: string;
  current?: number;
  target?: number;
}

export interface QuestProgress {
  quest_id: string;
  status: string;
  checks: QuestCriterionCheck[];
  eligible: boolean;
  minted: boolean;
  mint_tx_hash?: string;
  lifetime_entropy?: number;
  farming_detected?: boolean;
  suspected_accounts?: string[];
  wallet_address?: string;
}

export interface BoardPassLeader {
  rank: number;
  telegram_id: number;
  name: string;
  photo_url?: string;
  bw_id?: string;
  country_flag?: string;
  minted_at?: string;
  wave_index?: number;
}

export async function fetchQuests(filter: QuestFilter = "waves") {
  return getApi(`/quests?filter=${filter}`);
}

export async function fetchQuestDetail(questId: string) {
  return getApi(`/quests/${questId}`);
}

export async function fetchQuestBySlug(slug: string) {
  return getApi(`/quests/by-slug/${encodeURIComponent(slug)}`);
}

export async function fetchQuestProgress(questId: string) {
  return getApi(`/quests/${questId}/progress`);
}

export async function reportQuest(questId: string, reason?: string) {
  return postApi(`/quests/${questId}/report`, { reason: reason || "user_report" });
}

export async function toggleQuestSubscribe(questId: string) {
  return postApi(`/quests/${questId}/subscribe`, {});
}

export async function fetchQuestShare(questId: string) {
  return getApi(`/quests/${questId}/share`);
}

export async function fetchQuestBoardPass(questId: string) {
  return getApi(`/quests/${questId}/board-pass`);
}
