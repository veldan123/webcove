import type { Plan, SubscriptionStatus } from "./plans";

// ---- Generated site content schema ----
// Claude must return JSON matching these shapes. See lib/prompts.ts for the
// instructions given to the model and lib/anthropic.ts for runtime validation.

export type SectionType =
  | "hero"
  | "about"
  | "services"
  | "features"
  | "stats"
  | "testimonials"
  | "gallery"
  | "cta"
  | "contact";

export interface HeroSection {
  type: "hero";
  headline: string;
  subheadline: string;
  ctaText?: string;
  ctaTarget?: string; // a page slug ("menu") or "contact"
  secondaryCtaText?: string;
  secondaryCtaTarget?: string;
  badge?: string; // small pill above the headline
  highlights?: string[]; // info chips, e.g. "Open daily 11–9"
  imageUrl?: string; // full-bleed background image
  imagePrompt?: string; // used to generate a background image
}

export interface StatsSection {
  type: "stats";
  items: { value: string; label: string }[];
}

export interface AboutSection {
  type: "about";
  heading: string;
  body: string;
}

export interface ServicesSection {
  type: "services";
  heading: string;
  items: {
    title: string;
    description: string;
    price?: string; // e.g. "$12.95"
    badge?: string; // e.g. "Most Popular"
    imageUrl?: string;
    imagePrompt?: string;
  }[];
}

export interface FeaturesSection {
  type: "features";
  heading: string;
  items: { title: string; description: string }[];
}

export interface TestimonialsSection {
  type: "testimonials";
  heading: string;
  items: { quote: string; author: string }[];
}

export interface GallerySection {
  type: "gallery";
  heading: string;
  items: { caption: string; imageUrl?: string }[];
}

export interface CtaSection {
  type: "cta";
  heading: string;
  body: string;
  buttonText: string;
  buttonTarget?: string; // page slug or "contact"
}

export interface ContactSection {
  type: "contact";
  heading: string;
  body?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export type Section =
  | HeroSection
  | AboutSection
  | ServicesSection
  | FeaturesSection
  | StatsSection
  | TestimonialsSection
  | GallerySection
  | CtaSection
  | ContactSection;

export interface PageContent {
  sections: Section[];
}

export interface GeneratedPage {
  title: string;
  slug: string; // e.g. "home", "about", "services"
  content: PageContent;
  order: number;
}

export type TemplateName =
  | "aurora" // modern SaaS: gradient hero, airy, rounded
  | "editorial" // elegant serif, left-aligned, understated
  | "bold" // high-impact, big type, solid color blocks
  | "playful" // friendly, rounded, colorful blobs
  | "minimal"; // lots of whitespace, tiny accents

export interface SiteTheme {
  primaryColor: string; // hex, e.g. "#2563eb"
  accentColor: string; // hex
  backgroundColor: string; // hex
  textColor: string; // hex
  fontFamily?: string; // "sans" | "serif" (fallback; template usually sets font)
  template?: TemplateName;
  logoUrl?: string; // Pollinations-generated or user-uploaded logo image
}

// The full object Claude returns for a new site.
export interface GeneratedSite {
  theme: SiteTheme;
  pages: GeneratedPage[];
}

// ---- Contact info collected from the customer's form ----
export interface ContactInfo {
  phone?: string;
  email?: string;
  address?: string;
  tagline?: string;
}

// ---- Database row shapes ----
export interface ProfileRow {
  id: string;
  plan: Plan;
  subscription_status: SubscriptionStatus;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  publishes_this_period: number;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface SiteRow {
  id: string;
  owner_id: string;
  slug: string;
  business_name: string;
  business_type: string;
  business_description: string;
  contact_info: ContactInfo;
  generated_content: { theme: SiteTheme } | null;
  published: boolean;
  published_at: string | null;
  publish_expires_at: string | null; // Agency 48h sample expiry; null = permanent
  kept: boolean; // paid one-time to keep an approved sample live permanently
  rejected: boolean; // client turned the sample down (publish still counted)
  branding_removed: boolean; // paid one-time to remove the "Built with Webcove" badge
  custom_domain: string | null;
  custom_domain_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface PageRow {
  id: string;
  site_id: string;
  slug: string;
  title: string;
  content: PageContent;
  order: number;
}

export interface EmailCampaignRow {
  id: string;
  owner_id: string;
  site_id: string | null;
  recipient_email: string;
  recipient_business_name: string;
  price_quoted: number | null;
  recurring_fee: number | null;
  generated_email_body: string;
  sent_at: string | null;
  status: "draft" | "sent" | "failed";
}
