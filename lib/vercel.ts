import "server-only";

// Automates attaching customer domains to the Vercel project so Vercel serves
// them and issues SSL. Needs a Vercel API token; project/team default to this
// project's ids (from .vercel/repo.json) but can be overridden via env.
const TOKEN = process.env.VERCEL_API_TOKEN;
const PROJECT_ID =
  process.env.VERCEL_PROJECT_ID || "prj_kGu63cZIx0HQtfuKDnAytXFCqd7D";
const TEAM_ID = process.env.VERCEL_TEAM_ID || "team_d8MMamJqOkgGjS15N1jnSsT4";

export function isVercelConfigured(): boolean {
  return !!TOKEN;
}

function team() {
  return TEAM_ID ? `?teamId=${TEAM_ID}` : "";
}

async function vercel(path: string, init?: RequestInit) {
  const res = await fetch(`https://api.vercel.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

/** Adds a domain to the project. Idempotent-ish: treats "already exists" as ok. */
export async function addProjectDomain(domain: string) {
  const { ok, data } = await vercel(
    `/v10/projects/${PROJECT_ID}/domains${team()}`,
    { method: "POST", body: JSON.stringify({ name: domain }) }
  );
  if (!ok && data?.error?.code !== "domain_already_in_use") {
    throw new Error(data?.error?.message || "Failed to add domain to Vercel");
  }
  return data;
}

export async function removeProjectDomain(domain: string) {
  await vercel(`/v9/projects/${PROJECT_ID}/domains/${domain}${team()}`, {
    method: "DELETE",
  });
}

/** Returns whether Vercel has verified the domain and considers DNS correct. */
export async function getDomainStatus(
  domain: string
): Promise<{ verified: boolean; misconfigured: boolean }> {
  const prj = await vercel(
    `/v9/projects/${PROJECT_ID}/domains/${domain}${team()}`
  );
  const cfg = await vercel(`/v6/domains/${domain}/config${team()}`);
  const verified = prj.ok ? prj.data?.verified !== false : false;
  const misconfigured = cfg.ok ? cfg.data?.misconfigured === true : true;
  return { verified: verified && !misconfigured, misconfigured };
}
