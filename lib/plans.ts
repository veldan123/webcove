// Single source of truth for plan limits. Never scatter these checks —
// every server-side gate (publish, email tool, generation) reads from here.

export type Plan = "none" | "basic" | "pro" | "agency";
export type SubscriptionStatus =
  | "inactive"
  | "active"
  | "past_due"
  | "canceled";

export interface PlanLimit {
  maxPagesPerSite: number;
  maxPublishedSites: number | null; // null = unlimited (Agency uses monthly quota instead)
  monthlyPublishQuota: number | null; // null = not metered monthly (Basic/Pro cap concurrent sites)
  emailTool: boolean;
  priceUsd: number;
}

export const PLAN_LIMITS: Record<Exclude<Plan, "none">, PlanLimit> = {
  basic: {
    maxPagesPerSite: 3,
    maxPublishedSites: 1,
    monthlyPublishQuota: null,
    emailTool: false,
    priceUsd: 15,
  },
  pro: {
    maxPagesPerSite: 10,
    maxPublishedSites: 1,
    monthlyPublishQuota: null,
    emailTool: false,
    priceUsd: 25,
  },
  agency: {
    maxPagesPerSite: 6,
    maxPublishedSites: null,
    monthlyPublishQuota: 10, // 10 sample publishes / month, counted even if rejected
    emailTool: true,
    priceUsd: 35,
  },
};

// Plans with no active subscription still get a realistic *preview* capped at
// the Basic page limit so they see what they'd get before subscribing.
export const PREVIEW_FALLBACK_PLAN: Exclude<Plan, "none"> = "basic";

/**
 * Returns the effective limits for a plan. For `none` (no subscription),
 * falls back to the Basic limits so previews are realistically capped.
 */
export function getPlanLimits(plan: Plan): PlanLimit {
  if (plan === "none") return PLAN_LIMITS[PREVIEW_FALLBACK_PLAN];
  return PLAN_LIMITS[plan];
}

export function isPaidPlan(plan: Plan): plan is Exclude<Plan, "none"> {
  return plan !== "none";
}

export const PLAN_LABELS: Record<Plan, string> = {
  none: "No plan",
  basic: "Basic",
  pro: "Pro",
  agency: "Agency",
};
