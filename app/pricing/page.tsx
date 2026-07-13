import Link from "next/link";
import { getUserAndProfile } from "@/lib/auth";
import { PLAN_LIMITS, type Plan } from "@/lib/plans";
import { SubscribeButton } from "@/components/SubscribeButton";
import { ManageBillingButton } from "@/components/ManageBillingButton";

export const dynamic = "force-dynamic";

const PLANS: {
  key: Exclude<Plan, "none">;
  name: string;
  blurb: string;
  features: string[];
}[] = [
  {
    key: "basic",
    name: "Basic",
    blurb: "One simple site, up and running.",
    features: [
      `${PLAN_LIMITS.basic.maxPagesPerSite} pages per site`,
      "1 published site at a time",
      "AI generation + edit chat",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    blurb: "More room for a richer site.",
    features: [
      `${PLAN_LIMITS.pro.maxPagesPerSite} pages per site`,
      "1 published site at a time",
      "AI generation + edit chat",
    ],
  },
  {
    key: "agency",
    name: "Agency",
    blurb: "Build sites for many clients.",
    features: [
      `${PLAN_LIMITS.agency.maxPagesPerSite} pages per site`,
      `${PLAN_LIMITS.agency.monthlyPublishQuota} publishes per month`,
      "Unlimited published sites",
      "Cold-email outreach tool",
    ],
  },
];

export default async function PricingPage() {
  const session = await getUserAndProfile();
  const isAuthed = !!session;
  const currentPlan: Plan = session?.profile.plan ?? "none";
  const hasBilling = !!session?.profile.stripe_customer_id;

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <div className="flex items-center justify-between">
        <Link href={isAuthed ? "/dashboard" : "/"} className="text-sm text-foreground/60 hover:text-foreground">
          ← Back
        </Link>
        {hasBilling && <ManageBillingButton />}
      </div>

      <div className="mt-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          Choose your plan
        </h1>
        <p className="mt-2 text-foreground/60">
          Generating and previewing sites is always free. A plan lets you
          publish.
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {PLANS.map((p) => {
          const limits = PLAN_LIMITS[p.key];
          const isCurrent = currentPlan === p.key;
          return (
            <div
              key={p.key}
              className={`flex flex-col rounded-2xl border p-6 ${
                p.key === "pro"
                  ? "border-foreground/40 shadow-sm"
                  : "border-foreground/10"
              }`}
            >
              <h2 className="text-lg font-semibold">{p.name}</h2>
              <p className="mt-1 text-sm text-foreground/60">{p.blurb}</p>
              <div className="mt-4 text-4xl font-bold">
                ${limits.priceUsd}
                <span className="text-base font-normal text-foreground/50">
                  /mo
                </span>
              </div>
              <ul className="mt-5 flex-1 space-y-2 text-sm text-foreground/75">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-green-600">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <SubscribeButton
                  plan={p.key}
                  isAuthed={isAuthed}
                  isCurrent={isCurrent}
                  label={
                    currentPlan === "none"
                      ? `Choose ${p.name}`
                      : `Switch to ${p.name}`
                  }
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
