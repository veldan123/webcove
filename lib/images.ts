// Pollinations.ai — free, keyless image generation. We just build a URL and
// the <img> loads it; the image is generated on first request.
const BASE = "https://image.pollinations.ai/prompt/";

export function pollinationsUrl(
  prompt: string,
  opts: { width?: number; height?: number; seed?: number } = {}
): string {
  const { width = 768, height = 768, seed } = opts;
  const params = new URLSearchParams({
    width: String(width),
    height: String(height),
    nologo: "true",
    model: "flux",
  });
  if (seed !== undefined) params.set("seed", String(seed));
  return `${BASE}${encodeURIComponent(prompt.slice(0, 300))}?${params.toString()}`;
}

// A stable seed from a string so the same business keeps the same images.
function seedFrom(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100000;
  return h;
}

export function logoUrlFor(businessName: string, businessType: string): string {
  return pollinationsUrl(
    `modern minimalist logo icon for "${businessName}", ${businessType}, flat vector, simple, centered, clean background`,
    { width: 256, height: 256, seed: seedFrom(businessName + businessType) }
  );
}

export function galleryImageUrl(caption: string, seedKey: string): string {
  return pollinationsUrl(
    `${caption}, professional photograph, high quality, well lit`,
    { width: 800, height: 600, seed: seedFrom(seedKey + caption) }
  );
}

export function heroImageUrl(prompt: string, seedKey: string): string {
  return pollinationsUrl(
    `${prompt}, cinematic, atmospheric, professional photography, high detail`,
    { width: 1600, height: 900, seed: seedFrom(seedKey) }
  );
}

export function cardImageUrl(prompt: string, seedKey: string): string {
  return pollinationsUrl(`${prompt}, professional photograph, high quality`, {
    width: 800,
    height: 600,
    seed: seedFrom(seedKey),
  });
}
