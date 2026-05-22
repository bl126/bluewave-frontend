import type { QuestCriterionCheck } from "@/lib/questsApi";

/** Instant criteria UI from profile — entropy filled when API returns. */
export function buildLocalQuestChecks(
  user: {
    is_human_verified?: boolean;
    roles?: string[];
    total_referrals?: number;
  } | null | undefined,
  lifetimeEntropy?: number | null
): QuestCriterionCheck[] {
  const roles = user?.roles || [];
  const isVerified =
    !!user?.is_human_verified || roles.includes("Verified Human");
  const hasBuilder =
    roles.includes("Network Builder") || (user?.total_referrals ?? 0) >= 10;
  const entropy = lifetimeEntropy ?? 0;
  const target = 10000;
  const entropyDone = entropy >= target;

  return [
    {
      id: "verified_human",
      label: "Verified Human",
      done: isVerified,
      detail: isVerified
        ? "Yes, you are a Verified Human."
        : "Not yet — reach Verified Human status (presence score 80+).",
    },
    {
      id: "network_builder_badge",
      label: "Network Builder Badge",
      done: hasBuilder,
      detail: hasBuilder
        ? "Yes, you have the Network Builder badge."
        : "Not yet — onboard 10+ humans to earn the badge.",
    },
    {
      id: "lifetime_entropy",
      label: "Lifetime Entropy",
      done: entropyDone,
      current: entropy,
      target,
      detail:
        lifetimeEntropy == null
          ? "Syncing your lifetime entropy…"
          : `${entropy.toLocaleString()} / ${target.toLocaleString()} lifetime entropy units`,
    },
  ];
}
