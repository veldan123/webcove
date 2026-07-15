import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import {
  SITE_GENERATION_SYSTEM_PROMPT,
  EDIT_CHAT_SYSTEM_PROMPT,
  COLD_EMAIL_SYSTEM_PROMPT,
} from "./prompts";
import type {
  ContactInfo,
  GeneratedSite,
  PageContent,
  SiteTheme,
} from "./types";
import {
  logoUrlFor,
  heroImageUrl,
  cardImageUrl,
  galleryImageUrl,
} from "./images";
import { isPexelsConfigured, searchPexels } from "./pexels";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

// ---- Runtime validation (mirrors lib/types.ts) ----
const hex = z.string().regex(/^#([0-9a-fA-F]{6})$/, "expected #RRGGBB hex");

const sectionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("hero"),
    headline: z.string(),
    subheadline: z.string(),
    ctaText: z.string().optional(),
    ctaTarget: z.string().optional(),
    secondaryCtaText: z.string().optional(),
    secondaryCtaTarget: z.string().optional(),
    badge: z.string().optional(),
    highlights: z.array(z.string()).optional(),
    imageUrl: z.string().url().optional(),
    imagePrompt: z.string().optional(),
  }),
  z.object({ type: z.literal("about"), heading: z.string(), body: z.string() }),
  z.object({
    type: z.literal("services"),
    heading: z.string(),
    items: z.array(
      z.object({
        title: z.string(),
        description: z.string(),
        price: z.string().optional(),
        badge: z.string().optional(),
        imageUrl: z.string().url().optional(),
        imagePrompt: z.string().optional(),
      })
    ),
  }),
  z.object({
    type: z.literal("stats"),
    items: z.array(z.object({ value: z.string(), label: z.string() })),
  }),
  z.object({
    type: z.literal("features"),
    heading: z.string(),
    items: z.array(z.object({ title: z.string(), description: z.string() })),
  }),
  z.object({
    type: z.literal("testimonials"),
    heading: z.string(),
    items: z.array(z.object({ quote: z.string(), author: z.string() })),
  }),
  z.object({
    type: z.literal("gallery"),
    heading: z.string(),
    items: z.array(
      z.object({ caption: z.string(), imageUrl: z.string().url().optional() })
    ),
  }),
  z.object({
    type: z.literal("cta"),
    heading: z.string(),
    body: z.string(),
    buttonText: z.string(),
    buttonTarget: z.string().optional(),
  }),
  z.object({
    type: z.literal("contact"),
    heading: z.string(),
    body: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    address: z.string().optional(),
  }),
]);

const pageContentSchema = z.object({ sections: z.array(sectionSchema) });

const generatedSiteSchema = z.object({
  theme: z.object({
    template: z
      .enum(["aurora", "editorial", "bold", "playful", "minimal"])
      .optional(),
    primaryColor: hex,
    accentColor: hex,
    backgroundColor: hex,
    textColor: hex,
    fontFamily: z.enum(["sans", "serif"]).optional(),
    logoUrl: z.string().url().optional(),
  }),
  pages: z
    .array(
      z.object({
        title: z.string(),
        slug: z.string(),
        order: z.number(),
        content: pageContentSchema,
      })
    )
    .min(1),
});

// Strip accidental ```json fences / stray prose and return the JSON substring.
function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1);
  }
  return text.trim();
}

function textFromResponse(msg: Anthropic.Message): string {
  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

/**
 * Generate a full site (theme + pages) from the customer's business details.
 * @param maxPages hard cap enforced by the caller's plan (or the Basic preview cap).
 */
export async function generateSite(input: {
  businessName: string;
  businessType: string;
  businessDescription: string;
  contact: ContactInfo;
  maxPages: number;
}): Promise<GeneratedSite> {
  const system = SITE_GENERATION_SYSTEM_PROMPT.replace(
    "{{MAX_PAGES}}",
    String(input.maxPages)
  );

  const userMessage = [
    `Business name: ${input.businessName}`,
    `Business type/category: ${input.businessType}`,
    `What they do / services: ${input.businessDescription}`,
    input.contact.tagline ? `Tagline / differentiator: ${input.contact.tagline}` : "",
    input.contact.phone ? `Contact phone: ${input.contact.phone}` : "",
    input.contact.email ? `Contact email: ${input.contact.email}` : "",
    input.contact.address ? `Contact address: ${input.contact.address}` : "",
    ``,
    `Generate the website now. Remember: at most ${input.maxPages} pages, JSON only.`,
  ]
    .filter(Boolean)
    .join("\n");

  const msg = await client().messages.create({
    model: MODEL,
    max_tokens: 8000,
    system,
    messages: [{ role: "user", content: userMessage }],
  });

  const raw = extractJson(textFromResponse(msg));
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Claude returned invalid JSON for site generation");
  }
  const result = generatedSiteSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      "Claude output did not match the site schema: " + result.error.message
    );
  }

  // Enforce the page cap defensively even if the model overshot.
  const pages = result.data.pages
    .sort((a, b) => a.order - b.order)
    .slice(0, input.maxPages);

  // Auto-generate a logo via Pollinations unless the model provided one.
  const theme: SiteTheme = {
    ...result.data.theme,
    logoUrl:
      result.data.theme.logoUrl ||
      logoUrlFor(input.businessName, input.businessType),
  };

  // Fill hero/service/gallery images. Prefer real Pexels stock photos (fast,
  // reliable, professional); fall back to Pollinations when Pexels isn't
  // configured or returns nothing.
  const usedPhotoIds = new Set<number>();
  const pick = async (
    query: string,
    fallback: () => string
  ): Promise<string> => {
    if (isPexelsConfigured()) {
      const p = await searchPexels(query, {
        orientation: "landscape",
        exclude: usedPhotoIds,
      });
      if (p) {
        usedPhotoIds.add(p.id);
        return p.url;
      }
    }
    return fallback();
  };

  for (const page of pages) {
    for (const section of page.content.sections) {
      if (section.type === "hero" && !section.imageUrl) {
        section.imageUrl = await pick(
          section.imagePrompt || input.businessType,
          () =>
            heroImageUrl(
              section.subheadline || input.businessType,
              input.businessName + "hero" + page.slug
            )
        );
      }
      if (section.type === "services") {
        for (const item of section.items) {
          if (!item.imageUrl) {
            item.imageUrl = await pick(
              item.imagePrompt || `${item.title} ${input.businessType}`,
              () => cardImageUrl(item.title, input.businessName + item.title)
            );
          }
        }
      }
      if (section.type === "gallery") {
        for (const item of section.items) {
          if (!item.imageUrl) {
            item.imageUrl = await pick(
              `${item.caption} ${input.businessType}`,
              () =>
                galleryImageUrl(item.caption, input.businessName + item.caption)
            );
          }
        }
      }
    }
  }

  return { theme, pages };
}

/**
 * Conversational editor: answers questions AND edits the page.
 * Returns a friendly `reply` plus `content` (the updated page) when a change
 * was made, or `content: null` when the user was only chatting/asking.
 */
const themePatchSchema = z
  .object({
    template: z
      .enum(["aurora", "editorial", "bold", "playful", "minimal"])
      .optional(),
    primaryColor: hex.optional(),
    accentColor: hex.optional(),
    backgroundColor: hex.optional(),
    textColor: hex.optional(),
    logoUrl: z.string().url().optional(),
  })
  .nullable()
  .optional();

export async function chatEdit(input: {
  instruction: string;
  currentContent: PageContent;
  imageUrl?: string;
}): Promise<{
  reply: string;
  content: PageContent | null;
  themePatch: Partial<SiteTheme> | null;
}> {
  const userMessage = [
    `Current page content JSON:`,
    JSON.stringify(input.currentContent),
    ``,
    input.imageUrl
      ? `The user attached an image. Its URL is: ${input.imageUrl}\nIf they want it used as the logo, set themePatch.logoUrl to exactly this URL. If they want it in a gallery, add a gallery item with "imageUrl" set to this URL.`
      : ``,
    `User message: ${input.instruction}`,
    ``,
    `Respond with the { "reply", "updatedContent", "themePatch" } JSON object.`,
  ]
    .filter(Boolean)
    .join("\n");

  const msg = await client().messages.create({
    model: MODEL,
    max_tokens: 8000,
    system: EDIT_CHAT_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const raw = extractJson(textFromResponse(msg));
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Claude returned invalid JSON for the chat");
  }

  const envelope = z
    .object({
      reply: z.string(),
      updatedContent: pageContentSchema.nullable().optional(),
      themePatch: themePatchSchema,
    })
    .safeParse(parsed);
  if (!envelope.success) {
    throw new Error(
      "Chat response did not match the expected shape: " +
        envelope.error.message
    );
  }

  return {
    reply: envelope.data.reply,
    content: envelope.data.updatedContent ?? null,
    themePatch: envelope.data.themePatch ?? null,
  };
}

/**
 * Draft a cold-outreach email for the Agency email tool.
 */
export async function draftColdEmail(input: {
  recipientBusinessName: string;
  priceQuoted: number;
  recurringFee?: number | null;
  recurringPeriod?: "month" | "year";
  senderContext?: string;
}): Promise<string> {
  const hasRecurring = !!input.recurringFee && input.recurringFee > 0;
  const userMessage = [
    `Recipient business: ${input.recipientBusinessName}`,
    `One-time build price: $${input.priceQuoted}`,
    hasRecurring
      ? `Recurring hosting fee: $${input.recurringFee} per ${input.recurringPeriod ?? "month"}`
      : `Recurring fee: NONE — this is a one-time project with no ongoing charges.`,
    input.senderContext ? `Extra context: ${input.senderContext}` : "",
    ``,
    `Write the email body now.`,
  ]
    .filter(Boolean)
    .join("\n");

  const msg = await client().messages.create({
    model: MODEL,
    max_tokens: 1000,
    system: COLD_EMAIL_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const body = textFromResponse(msg).trim();
  if (!body) throw new Error("Claude returned an empty email draft");
  return body;
}
