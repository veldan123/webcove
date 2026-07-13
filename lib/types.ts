import type { Plan, SubscriptionStatus } from "./plans";

// ---- Generated site content schema ----
// Claude must return JSON matching these shapes. See lib/prompts.ts for the
// instructions given to the model and lib/anthropic.ts for runtime validation.

export type SectionType =
  | "hero"
  | "about"
  | "services"
  | "features"
  | "testimonials"
  | "gallery"
  | "cta"
  | "contact";

export interface HeroSection {
  type: "hero";
  headline: string;
  subheadline: string;
  ctaText?: string;
}

export interface AboutSection {
  type: "about";
  heading: string;
  body: string;
}

export interface ServicesSection {
  type: "services";
  heading: string;
  items: { title: string; description: string }[];
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
  items: { caption: string }[];
}

export interface CtaSection {
  type: "cta";
  heading: string;
  body: string;
  buttonText: string;
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

export interface SiteTheme {
  primaryColor: string; // hex, e.g. "#2563eb"
  accentColor: string; // hex
  backgroundColor: string; // hex
  textColor: string; // hex
  fontFamily?: string; // e.g. "sans" | "serif"
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
