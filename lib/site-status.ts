import type { SiteRow } from "./types";

// How long an Agency "sample" site stays live before it comes down.
export const SAMPLE_HOURS = 48;
export const SAMPLE_MS = SAMPLE_HOURS * 60 * 60 * 1000;

// One-time fee (USD) to keep an approved sample live permanently.
export const KEEP_SITE_PRICE_USD = 25;

type SiteLike = Pick<
  SiteRow,
  "published" | "kept" | "publish_expires_at"
>;

/**
 * A site is actually live to the public if it's published AND either kept
 * permanently, has no expiry, or its 48-hour sample window hasn't elapsed.
 * This is the real gate — the `published` flag alone can be stale after a
 * sample expires (we don't run a background job to flip it).
 */
export function isSiteLive(site: SiteLike): boolean {
  if (!site.published) return false;
  if (site.kept) return true;
  if (!site.publish_expires_at) return true;
  return new Date(site.publish_expires_at).getTime() > Date.now();
}

/** True if this is an Agency sample whose 48h window has elapsed. */
export function isSampleExpired(site: SiteLike): boolean {
  return (
    site.published &&
    !site.kept &&
    !!site.publish_expires_at &&
    new Date(site.publish_expires_at).getTime() <= Date.now()
  );
}

/** Milliseconds left in an active sample window, or 0 if not an active sample. */
export function sampleTimeRemainingMs(site: SiteLike): number {
  if (site.kept || !site.publish_expires_at) return 0;
  return Math.max(0, new Date(site.publish_expires_at).getTime() - Date.now());
}
