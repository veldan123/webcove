import "server-only";

// Real stock photos from Pexels — fast CDN, reliable, professional. Used as the
// primary image source; Pollinations remains a keyless fallback.
const SEARCH = "https://api.pexels.com/v1/search";

export function isPexelsConfigured(): boolean {
  return !!process.env.PEXELS_API_KEY;
}

interface PexelsPhoto {
  id: number;
  src: { large2x?: string; large?: string; original?: string };
}

/**
 * Searches Pexels for a photo. `exclude` avoids reusing the same photo across a
 * site. Returns null (so the caller can fall back) on any failure.
 */
export async function searchPexels(
  query: string,
  opts: {
    orientation?: "landscape" | "portrait" | "square";
    exclude?: Set<number>;
  } = {}
): Promise<{ url: string; id: number } | null> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return null;
  try {
    const params = new URLSearchParams({
      query: query.slice(0, 100),
      per_page: "12",
      orientation: opts.orientation || "landscape",
    });
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(`${SEARCH}?${params.toString()}`, {
      headers: { Authorization: key },
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = (await res.json()) as { photos?: PexelsPhoto[] };
    const photos = data.photos ?? [];
    const pick =
      photos.find((p) => !opts.exclude?.has(p.id)) ?? photos[0] ?? null;
    if (!pick) return null;
    const url = pick.src.large2x || pick.src.large || pick.src.original;
    return url ? { url, id: pick.id } : null;
  } catch {
    return null;
  }
}
