import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import {
  SITE_GENERATION_SYSTEM_PROMPT,
  EDIT_CHAT_SYSTEM_PROMPT,
  COLD_EMAIL_SYSTEM_PROMPT,
} from "./prompts";
import type { ContactInfo, GeneratedSite, PageContent } from "./types";

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
  }),
  z.object({ type: z.literal("about"), heading: z.string(), body: z.string() }),
  z.object({
    type: z.literal("services"),
    heading: z.string(),
    items: z.array(z.object({ title: z.string(), description: z.string() })),
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
    items: z.array(z.object({ caption: z.string() })),
  }),
  z.object({
    type: z.literal("cta"),
    heading: z.string(),
    body: z.string(),
    buttonText: z.string(),
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
    primaryColor: hex,
    accentColor: hex,
    backgroundColor: hex,
    textColor: hex,
    fontFamily: z.enum(["sans", "serif"]).optional(),
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

  return { theme: result.data.theme, pages };
}

/**
 * Edit a single page's content based on a natural-language instruction.
 * Returns the full updated PageContent (patch the row with this).
 */
export async function editPage(input: {
  instruction: string;
  currentContent: PageContent;
}): Promise<PageContent> {
  const userMessage = [
    `Current page content JSON:`,
    JSON.stringify(input.currentContent),
    ``,
    `Instruction: ${input.instruction}`,
    ``,
    `Return the complete updated content JSON only.`,
  ].join("\n");

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
    throw new Error("Claude returned invalid JSON for the page edit");
  }
  const result = pageContentSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      "Edited page did not match the content schema: " + result.error.message
    );
  }
  return result.data;
}

/**
 * Draft a cold-outreach email for the Agency email tool.
 */
export async function draftColdEmail(input: {
  recipientBusinessName: string;
  priceQuoted: number;
  recurringFee: number;
  senderContext?: string;
}): Promise<string> {
  const userMessage = [
    `Recipient business: ${input.recipientBusinessName}`,
    `One-time build price: $${input.priceQuoted}`,
    `Recurring monthly hosting fee: $${input.recurringFee}`,
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
