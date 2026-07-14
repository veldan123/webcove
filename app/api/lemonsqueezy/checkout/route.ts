import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserAndProfile } from "@/lib/auth";
import { createCheckout } from "@/lib/lemonsqueezy";

const bodySchema = z.object({ plan: z.enum(["basic", "pro", "agency"]) });

function baseUrl() {
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
}

export async function POST(request: Request) {
  const session = await getUserAndProfile();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  try {
    const url = await createCheckout({
      plan: parsed.data.plan,
      email: session.email,
      userId: session.userId,
      redirectUrl: `${baseUrl()}/dashboard?checkout=success`,
    });
    return NextResponse.json({ url });
  } catch (err) {
    console.error("Lemon Squeezy checkout failed:", err);
    return NextResponse.json(
      { error: "Could not start checkout." },
      { status: 502 }
    );
  }
}
