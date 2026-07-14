import { NextResponse } from "next/server";
import {
  verifyWebhook,
  planForVariant,
  mapLsStatus,
} from "@/lib/lemonsqueezy";
import { createAdminClient } from "@/lib/supabase/admin";
import { isResendConfigured } from "@/lib/resend";
import { sendPlanThankYouEmail } from "@/lib/email";
import { PLAN_LABELS, type Plan, type SubscriptionStatus } from "@/lib/plans";

type Patch = {
  plan?: Plan;
  subscription_status?: SubscriptionStatus;
  stripe_customer_id?: string; // reused to store the LS customer id
  stripe_subscription_id?: string; // reused to store the LS subscription id
  current_period_end?: string | null;
};

export async function POST(request: Request) {
  const raw = await request.text();
  const sig = request.headers.get("x-signature");
  if (!verifyWebhook(raw, sig)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: {
    meta?: { event_name?: string; custom_data?: { user_id?: string } };
    data?: {
      id?: string;
      attributes?: {
        status?: string;
        variant_id?: number | string;
        customer_id?: number | string;
        renews_at?: string | null;
        user_email?: string;
        user_name?: string;
      };
    };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  const name = event.meta?.event_name ?? "";
  const attrs = event.data?.attributes ?? {};
  const subId = event.data?.id ? String(event.data.id) : undefined;
  const userId = event.meta?.custom_data?.user_id;
  const admin = createAdminClient();

  async function patch(p: Patch) {
    // Prefer the user_id from checkout; fall back to the LS subscription id.
    const q = admin.from("profiles").update(p);
    const { error } = userId
      ? await q.eq("id", userId)
      : await q.eq("stripe_subscription_id", subId ?? "");
    if (error) console.error("profile patch failed:", error);
  }

  try {
    switch (name) {
      case "subscription_created":
      case "subscription_updated":
      case "subscription_resumed":
      case "subscription_unpaused":
      case "subscription_payment_success": {
        const plan = planForVariant(attrs.variant_id ?? null);
        await patch({
          ...(plan ? { plan } : {}),
          subscription_status: mapLsStatus(attrs.status ?? ""),
          stripe_customer_id: attrs.customer_id
            ? String(attrs.customer_id)
            : undefined,
          stripe_subscription_id: subId,
          current_period_end: attrs.renews_at ?? null,
        });

        if (
          name === "subscription_created" &&
          plan &&
          isResendConfigured() &&
          attrs.user_email
        ) {
          try {
            await sendPlanThankYouEmail(
              attrs.user_email,
              PLAN_LABELS[plan],
              attrs.user_name
            );
          } catch (e) {
            console.error("Thank-you email failed:", e);
          }
        }
        break;
      }

      case "subscription_expired":
      case "subscription_paused": {
        await patch({ subscription_status: "inactive", plan: "none" });
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error(`LS webhook ${name} error:`, err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
