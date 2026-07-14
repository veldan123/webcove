import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserAndProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  addProjectDomain,
  removeProjectDomain,
  getDomainStatus,
  isVercelConfigured,
} from "@/lib/vercel";
import type { SiteRow } from "@/lib/types";

// Accepts a bare domain like "example.com" or "www.example.com".
const domainSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)+$/,
    "Enter a valid domain like example.com"
  );

async function ownedSite(siteId: string) {
  const session = await getUserAndProfile();
  if (!session) return { error: "Not authenticated", status: 401 as const };
  const supabase = await createClient();
  const { data: site } = await supabase
    .from("sites")
    .select("*")
    .eq("id", siteId)
    .single<SiteRow>();
  if (!site || site.owner_id !== session.userId)
    return { error: "Site not found", status: 404 as const };
  return { session, supabase, site };
}

// Attach a domain to this site (and to the Vercel project if configured).
export async function POST(
  request: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;
  const ctx = await ownedSite(siteId);
  if ("error" in ctx)
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const parsed = domainSchema.safeParse(
    (await request.json().catch(() => ({})))?.domain
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid domain" },
      { status: 400 }
    );
  }
  const domain = parsed.data;

  // Ensure it's not already claimed by another site.
  const { data: taken } = await ctx.supabase
    .from("sites")
    .select("id")
    .eq("custom_domain", domain)
    .neq("id", siteId)
    .maybeSingle();
  if (taken) {
    return NextResponse.json(
      { error: "That domain is already connected to another site." },
      { status: 409 }
    );
  }

  if (isVercelConfigured()) {
    try {
      await addProjectDomain(domain);
    } catch (e) {
      console.error("Vercel addProjectDomain failed:", e);
      return NextResponse.json(
        { error: "Could not register the domain. Try again." },
        { status: 502 }
      );
    }
  }

  await ctx.supabase
    .from("sites")
    .update({ custom_domain: domain, custom_domain_verified: false })
    .eq("id", siteId);

  return NextResponse.json({
    domain,
    // DNS the customer must add at their registrar.
    dns: dnsInstructions(domain),
    automated: isVercelConfigured(),
  });
}

// Re-check verification status with Vercel and persist it.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;
  const ctx = await ownedSite(siteId);
  if ("error" in ctx)
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!ctx.site.custom_domain) {
    return NextResponse.json({ domain: null, verified: false });
  }

  let verified = ctx.site.custom_domain_verified;
  if (isVercelConfigured()) {
    try {
      const status = await getDomainStatus(ctx.site.custom_domain);
      verified = status.verified;
      if (verified !== ctx.site.custom_domain_verified) {
        await ctx.supabase
          .from("sites")
          .update({ custom_domain_verified: verified })
          .eq("id", siteId);
      }
    } catch (e) {
      console.error("getDomainStatus failed:", e);
    }
  }

  return NextResponse.json({
    domain: ctx.site.custom_domain,
    verified,
    dns: dnsInstructions(ctx.site.custom_domain),
  });
}

// Disconnect the domain.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;
  const ctx = await ownedSite(siteId);
  if ("error" in ctx)
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  if (ctx.site.custom_domain && isVercelConfigured()) {
    await removeProjectDomain(ctx.site.custom_domain).catch(() => {});
  }
  await ctx.supabase
    .from("sites")
    .update({ custom_domain: null, custom_domain_verified: false })
    .eq("id", siteId);
  return NextResponse.json({ ok: true });
}

// Returns the DNS records the customer adds at their registrar. Apex domains
// (example.com) use an A record; subdomains (www.example.com) use a CNAME.
function dnsInstructions(domain: string) {
  const isApex = domain.split(".").length === 2;
  if (isApex) {
    return {
      kind: "apex" as const,
      records: [
        { type: "A", name: "@", value: "216.198.79.1" },
        { type: "CNAME", name: "www", value: "cname.vercel-dns.com" },
      ],
    };
  }
  const sub = domain.split(".")[0];
  return {
    kind: "subdomain" as const,
    records: [{ type: "CNAME", name: sub, value: "cname.vercel-dns.com" }],
  };
}
