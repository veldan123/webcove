import { getPlanLimits, type Plan } from "./plans";
import type { ProfileRow } from "./types";

export interface UsageSummary {
  label: string; // e.g. "1 of 1 sites published"
  used: number;
  limit: number | null; // null = unlimited
  atLimit: boolean;
  metered: "concurrent" | "monthly" | "none";
}

/**
 * Computes how much of the plan's publish allowance is used.
 * @param publishedCount currently-published sites owned by the user.
 */
export function usageSummary(
  profile: ProfileRow,
  publishedCount: number
): UsageSummary {
  const plan: Plan = profile.plan;

  if (plan === "none") {
    return {
      label: "No plan — subscribe to publish",
      used: 0,
      limit: 0,
      atLimit: true,
      metered: "none",
    };
  }

  const limits = getPlanLimits(plan);

  // Agency: metered by publishes per billing period.
  if (limits.monthlyPublishQuota !== null) {
    const used = profile.publishes_this_period;
    const limit = limits.monthlyPublishQuota;
    return {
      label: `${used} of ${limit} sites published this month`,
      used,
      limit,
      atLimit: used >= limit,
      metered: "monthly",
    };
  }

  // Basic / Pro: metered by concurrently-published sites.
  const limit = limits.maxPublishedSites; // number for basic/pro
  return {
    label:
      limit === null
        ? `${publishedCount} published`
        : `${publishedCount} of ${limit} site${limit === 1 ? "" : "s"} published`,
    used: publishedCount,
    limit,
    atLimit: limit !== null && publishedCount >= limit,
    metered: "concurrent",
  };
}
