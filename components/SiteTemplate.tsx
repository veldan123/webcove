import type {
  PageContent,
  Section,
  SiteTheme,
  TemplateName,
} from "@/lib/types";
import type { CSSProperties } from "react";
import { galleryImageUrl } from "@/lib/images";

const DEFAULT_THEME: SiteTheme = {
  primaryColor: "#2563eb",
  accentColor: "#7c3aed",
  backgroundColor: "#ffffff",
  textColor: "#0f172a",
  fontFamily: "sans",
  template: "aurora",
};

export interface SiteNavItem {
  title: string;
  slug: string;
}

// ---- Template presets: each gives a genuinely different look ----
interface Tpl {
  name: TemplateName;
  font: string;
  heroAlign: "center" | "left";
  headingClass: string; // weight / tracking / case
  sectionPad: string;
  buttonClass: string; // shape
  cardClass: string;
  eyebrow: boolean; // small labels above headings
  heroBg: (t: SiteTheme) => CSSProperties;
  heroText: (t: SiteTheme) => CSSProperties; // hero text color (drenched heroes flip it)
  buttonStyle: (t: SiteTheme) => CSSProperties;
}

const TEMPLATES: Record<TemplateName, Tpl> = {
  aurora: {
    name: "aurora",
    font: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
    heroAlign: "center",
    headingClass: "font-bold tracking-tight",
    sectionPad: "py-20",
    buttonClass: "rounded-lg font-medium shadow-md",
    cardClass: "rounded-2xl shadow-sm",
    eyebrow: false,
    heroBg: (t) => ({
      background: `radial-gradient(120% 120% at 50% 0%, ${t.primaryColor}22, transparent 60%), linear-gradient(135deg, ${t.primaryColor}12, ${t.accentColor}12)`,
    }),
    heroText: () => ({}),
    buttonStyle: (t) => ({ backgroundColor: t.primaryColor, color: "#fff" }),
  },
  editorial: {
    name: "editorial",
    font: "Georgia, 'Times New Roman', serif",
    heroAlign: "left",
    headingClass: "font-normal tracking-tight",
    sectionPad: "py-24",
    buttonClass: "rounded-none font-medium uppercase tracking-widest text-sm",
    cardClass: "rounded-none",
    eyebrow: true,
    heroBg: () => ({}),
    heroText: () => ({}),
    buttonStyle: (t) => ({ backgroundColor: t.textColor, color: t.backgroundColor }),
  },
  bold: {
    name: "bold",
    font: "system-ui, -apple-system, Segoe UI, sans-serif",
    heroAlign: "left",
    headingClass: "font-black tracking-tighter uppercase",
    sectionPad: "py-16",
    buttonClass: "rounded-none font-bold uppercase tracking-wide",
    cardClass: "rounded-none",
    eyebrow: false,
    heroBg: (t) => ({ backgroundColor: t.primaryColor }),
    heroText: () => ({ color: "#ffffff" }),
    buttonStyle: (t) => ({ backgroundColor: "#ffffff", color: t.primaryColor }),
  },
  playful: {
    name: "playful",
    font: "'ui-rounded', 'SF Pro Rounded', 'Segoe UI', system-ui, sans-serif",
    heroAlign: "center",
    headingClass: "font-extrabold tracking-tight",
    sectionPad: "py-20",
    buttonClass: "rounded-full font-bold shadow-lg",
    cardClass: "rounded-[28px]",
    eyebrow: false,
    heroBg: (t) => ({
      background: `radial-gradient(60% 80% at 20% 10%, ${t.accentColor}33, transparent 60%), radial-gradient(60% 80% at 90% 20%, ${t.primaryColor}33, transparent 55%)`,
    }),
    heroText: () => ({}),
    buttonStyle: (t) => ({ backgroundColor: t.primaryColor, color: "#fff" }),
  },
  minimal: {
    name: "minimal",
    font: "system-ui, -apple-system, Segoe UI, Helvetica, sans-serif",
    heroAlign: "left",
    headingClass: "font-medium tracking-tight",
    sectionPad: "py-28",
    buttonClass: "rounded-md font-medium border",
    cardClass: "rounded-lg",
    eyebrow: true,
    heroBg: () => ({}),
    heroText: () => ({}),
    buttonStyle: (t) => ({
      backgroundColor: "transparent",
      color: t.textColor,
      borderColor: `${t.textColor}30`,
    }),
  },
};

/**
 * Shared renderer for a generated site page. Used by BOTH the workspace live
 * preview and the public `/[slug]` route. Pure/server-safe — no client hooks.
 */
export function SiteTemplate({
  theme,
  businessName,
  page,
  nav,
  basePath,
}: {
  theme?: SiteTheme | null;
  businessName: string;
  page: PageContent;
  nav?: SiteNavItem[];
  basePath?: string;
}) {
  const t = { ...DEFAULT_THEME, ...(theme ?? {}) };
  const tpl = TEMPLATES[t.template ?? "aurora"];

  // Where CTA/hero buttons point: the contact section on this page, else a
  // contact page in the nav, else nothing.
  const hasContactSection = page.sections.some((s) => s.type === "contact");
  const contactPage = nav?.find((n) => n.slug === "contact");
  const ctaHref = hasContactSection
    ? "#contact"
    : contactPage && basePath !== undefined
      ? `${basePath}/contact`
      : contactPage
        ? "#"
        : null;

  // Build a nav link. `basePath` undefined = preview (no links). "" = the site
  // is at the domain root (custom domain). "/slug" = under webcove.io/[slug].
  const linkFor = (slug: string) => {
    if (basePath === undefined) return "#";
    if (slug === "home") return basePath || "/";
    return `${basePath}/${slug}`;
  };

  return (
    <div
      style={{
        backgroundColor: t.backgroundColor,
        color: t.textColor,
        fontFamily: tpl.font,
      }}
    >
      {nav && nav.length > 0 && (
        <nav
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: `1px solid ${t.textColor}1a` }}
        >
          <span className="flex items-center gap-2.5">
            {t.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={t.logoUrl}
                alt=""
                className="h-9 w-9 rounded-md object-contain"
              />
            )}
            <span
              className={
                tpl.eyebrow ? "text-lg font-semibold" : "text-lg font-bold"
              }
            >
              {businessName}
            </span>
          </span>
          <div className="flex flex-wrap gap-5 text-sm">
            {nav.map((item) => (
              <a
                key={item.slug}
                href={linkFor(item.slug)}
                className="opacity-70 transition-opacity hover:opacity-100"
              >
                {item.title}
              </a>
            ))}
          </div>
        </nav>
      )}

      <div>
        {page.sections.map((section, i) => (
          <SectionRenderer
            key={i}
            section={section}
            theme={t}
            tpl={tpl}
            ctaHref={ctaHref}
            businessName={businessName}
          />
        ))}
      </div>

      <footer
        className="px-6 py-8 text-center text-sm opacity-60"
        style={{ borderTop: `1px solid ${t.textColor}1a` }}
      >
        © {new Date().getFullYear()} {businessName}
      </footer>
    </div>
  );
}

function Eyebrow({ tpl, theme, children }: { tpl: Tpl; theme: SiteTheme; children: string }) {
  if (!tpl.eyebrow) return null;
  return (
    <p
      className="mb-3 text-xs font-semibold uppercase tracking-[0.2em]"
      style={{ color: theme.primaryColor }}
    >
      {children}
    </p>
  );
}

// A CTA button that actually navigates (to the contact section/page).
function CtaButton({
  label,
  tpl,
  theme,
  href,
  variant = "primary",
}: {
  label: string;
  tpl: Tpl;
  theme: SiteTheme;
  href: string | null;
  variant?: "primary" | "onColor";
}) {
  const style: CSSProperties =
    variant === "onColor"
      ? { backgroundColor: "#ffffff", color: theme.primaryColor }
      : tpl.buttonStyle(theme);
  const cls = `mt-6 inline-block px-6 py-3 transition hover:opacity-90 ${tpl.buttonClass}`;
  if (href) {
    return (
      <a href={href} className={cls} style={style}>
        {label}
      </a>
    );
  }
  return (
    <span className={cls} style={style}>
      {label}
    </span>
  );
}

function SectionRenderer({
  section,
  theme,
  tpl,
  ctaHref,
  businessName,
}: {
  section: Section;
  theme: SiteTheme;
  tpl: Tpl;
  ctaHref: string | null;
  businessName: string;
}) {
  const pad = tpl.sectionPad;

  switch (section.type) {
    case "hero":
      return (
        <section
          className={`px-6 ${tpl.heroAlign === "center" ? "text-center" : "text-left"} ${pad}`}
          style={{ ...tpl.heroBg(theme), ...tpl.heroText(theme) }}
        >
          <div
            className={
              tpl.heroAlign === "center" ? "mx-auto max-w-3xl" : "mx-auto max-w-5xl"
            }
          >
            <h1
              className={`text-4xl sm:text-5xl ${tpl.name === "bold" ? "sm:text-7xl" : ""} ${tpl.headingClass}`}
            >
              {section.headline}
            </h1>
            <p
              className={`mt-5 max-w-xl text-lg opacity-80 ${tpl.heroAlign === "center" ? "mx-auto" : ""}`}
            >
              {section.subheadline}
            </p>
            {section.ctaText && (
              <CtaButton
                label={section.ctaText}
                tpl={tpl}
                theme={theme}
                href={ctaHref}
                variant={tpl.name === "bold" ? "onColor" : "primary"}
              />
            )}
          </div>
        </section>
      );

    case "about":
      return (
        <section className={`mx-auto max-w-3xl px-6 ${pad}`}>
          <Eyebrow tpl={tpl} theme={theme}>
            About
          </Eyebrow>
          <h2 className={`text-2xl sm:text-3xl ${tpl.headingClass}`}>
            {section.heading}
          </h2>
          <p className="mt-4 whitespace-pre-line text-lg leading-relaxed opacity-80">
            {section.body}
          </p>
        </section>
      );

    case "services":
    case "features":
      return (
        <section className={`mx-auto max-w-5xl px-6 ${pad}`}>
          <div className={tpl.heroAlign === "center" ? "text-center" : ""}>
            <Eyebrow tpl={tpl} theme={theme}>
              What we offer
            </Eyebrow>
            <h2 className={`text-2xl sm:text-3xl ${tpl.headingClass}`}>
              {section.heading}
            </h2>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {section.items.map((item, i) => (
              <div
                key={i}
                className={`p-6 ${tpl.cardClass}`}
                style={
                  tpl.name === "bold"
                    ? { backgroundColor: `${theme.primaryColor}` , color: "#fff" }
                    : tpl.name === "playful"
                      ? { backgroundColor: `${theme.accentColor}1f` }
                      : tpl.name === "minimal"
                        ? { borderTop: `2px solid ${theme.primaryColor}` }
                        : { border: `1px solid ${theme.textColor}1a` }
                }
              >
                <div
                  className="mb-3 h-1.5 w-10 rounded-full"
                  style={{ backgroundColor: theme.accentColor }}
                />
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm opacity-80">{item.description}</p>
              </div>
            ))}
          </div>
        </section>
      );

    case "testimonials":
      return (
        <section
          className={`px-6 ${pad}`}
          style={{ backgroundColor: `${theme.primaryColor}0d` }}
        >
          <div className="mx-auto max-w-5xl">
            <div className={tpl.heroAlign === "center" ? "text-center" : ""}>
              <Eyebrow tpl={tpl} theme={theme}>
                Testimonials
              </Eyebrow>
              <h2 className={`text-2xl sm:text-3xl ${tpl.headingClass}`}>
                {section.heading}
              </h2>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {section.items.map((item, i) => (
                <figure
                  key={i}
                  className={`p-6 ${tpl.cardClass}`}
                  style={{
                    backgroundColor: theme.backgroundColor,
                    border: `1px solid ${theme.textColor}1a`,
                  }}
                >
                  <blockquote className="text-lg italic opacity-90">
                    “{item.quote}”
                  </blockquote>
                  <figcaption className="mt-3 text-sm font-medium opacity-70">
                    — {item.author}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      );

    case "gallery":
      return (
        <section className={`mx-auto max-w-5xl px-6 ${pad}`}>
          <div className={tpl.heroAlign === "center" ? "text-center" : ""}>
            <h2 className={`text-2xl sm:text-3xl ${tpl.headingClass}`}>
              {section.heading}
            </h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {section.items.map((item, i) => (
              <div
                key={i}
                className={`relative aspect-video overflow-hidden ${tpl.cardClass}`}
                style={{ backgroundColor: `${theme.primaryColor}14` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.imageUrl || galleryImageUrl(item.caption, businessName)}
                  alt={item.caption}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-sm font-medium text-white">
                  {item.caption}
                </div>
              </div>
            ))}
          </div>
        </section>
      );

    case "cta":
      return (
        <section
          className={`px-6 text-center ${pad}`}
          style={{
            background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`,
            color: "#fff",
          }}
        >
          <h2 className={`text-2xl sm:text-4xl ${tpl.headingClass}`}>
            {section.heading}
          </h2>
          <p className="mx-auto mt-3 max-w-xl opacity-90">{section.body}</p>
          <CtaButton
            label={section.buttonText}
            tpl={tpl}
            theme={theme}
            href={ctaHref}
            variant="onColor"
          />
        </section>
      );

    case "contact":
      return (
        <section id="contact" className={`mx-auto max-w-3xl px-6 ${pad}`}>
          <Eyebrow tpl={tpl} theme={theme}>
            Contact
          </Eyebrow>
          <h2 className={`text-2xl sm:text-3xl ${tpl.headingClass}`}>
            {section.heading}
          </h2>
          {section.body && <p className="mt-3 text-lg opacity-80">{section.body}</p>}
          <div className="mt-6 space-y-2 text-lg opacity-80">
            {section.phone && <p>📞 {section.phone}</p>}
            {section.email && <p>✉️ {section.email}</p>}
            {section.address && <p>📍 {section.address}</p>}
          </div>
        </section>
      );

    default:
      return null;
  }
}
