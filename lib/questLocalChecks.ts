import type { QuestCriterionCheck } from "@/lib/questsApi";

/** Instant criteria UI from profile — entropy and network verified count filled when API returns. */
export function buildLocalQuestChecks(
  user: {
    is_human_verified?: boolean;
    roles?: string[];
    total_referrals?: number;
    streak_days?: number;
  } | null | undefined,
  lifetimeEntropy?: number | null,
  verifiedHumansCount?: number | null
): QuestCriterionCheck[] {
  const roles = user?.roles || [];
  const isVerified =
    !!user?.is_human_verified || roles.includes("Verified Human");
  const hasBuilder =
    roles.includes("Network Builder") || (user?.total_referrals ?? 0) >= 10;
  
  const entropy = lifetimeEntropy ?? 0;
  const entropyTarget = 10000;
  const entropyDone = entropy >= entropyTarget;

  const streak = user?.streak_days ?? 0;
  const streakTarget = 20;
  const streakDone = streak >= streakTarget;

  const verifiedCount = verifiedHumansCount ?? 0;
  const verifiedTarget = 5;
  const verifiedDone = verifiedCount >= verifiedTarget;

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
      target: entropyTarget,
      detail:
        lifetimeEntropy == null
          ? "Syncing your lifetime entropy…"
          : `${entropy.toLocaleString()} / ${entropyTarget.toLocaleString()} lifetime entropy units`,
    },
    {
      id: "streak_20days",
      label: "20-Day Streak",
      done: streakDone,
      current: streak,
      target: streakTarget,
      detail:
        user?.streak_days == null
          ? "Syncing your presence streak…"
          : (streakDone
              ? `Current streak: ${streak}/${streakTarget} days.`
              : `Not yet — reach a 20-day presence streak (current: ${streak}/${streakTarget}).`),
    },
    {
      id: "network_verified_humans",
      label: "5 Verified Humans in Network",
      done: verifiedDone,
      current: verifiedCount,
      target: verifiedTarget,
      detail:
        verifiedHumansCount == null
          ? "Syncing verified humans in network…"
          : (verifiedDone
              ? `Yes, you have ${verifiedCount} verified humans in your network.`
              : `Not yet — onboard 5 verified humans in your network (current: ${verifiedCount}/${verifiedTarget}).`),
    },
  ];
}
