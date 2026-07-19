// Reserved top-level paths that must never be used as a public site slug,
// otherwise a published site could shadow an app route.
export const RESERVED_SLUGS = new Set([
  "dashboard",
  "login",
  "logout",
  "pricing",
  "guide",
  "api",
  "auth",
  "_next",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "",
]);

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

/**
 * Builds a base slug from the business name, falling back to "site" if the
 * name has no url-safe characters or collides with a reserved path.
 */
export function baseSlugFor(businessName: string): string {
  const s = slugify(businessName);
  if (!s || RESERVED_SLUGS.has(s)) return "site";
  return s;
}
