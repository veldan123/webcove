import type {
  PageContent,
  Section,
  SiteTheme,
  TemplateName,
} from "@/lib/types";
import type { CSSProperties } from "react";
import { galleryImageUrl, cardImageUrl, heroImageUrl } from "@/lib/images";
import { SiteImage } from "@/components/SiteImage";
import { SiteMotion } from "@/components/SiteMotion";

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

interface Tpl {
  name: TemplateName;
  font: string;
  headingClass: string;
  sectionPad: string;
  buttonClass: string;
  cardClass: string;
  eyebrow: boolean;
  buttonStyle: (t: SiteTheme) => CSSProperties;
}

const TEMPLATES: Record<TemplateName, Tpl> = {
  aurora: {
    name: "aurora",
    font: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
    headingClass: "font-bold tracking-tight",
    sectionPad: "py-20",
    buttonClass: "rounded-lg font-medium shadow-md",
    cardClass: "rounded-2xl shadow-sm",
    eyebrow: false,
    buttonStyle: (t) => ({ backgroundColor: t.primaryColor, color: "#fff" }),
  },
  editorial: {
    name: "editorial",
    font: "Georgia, 'Times New Roman', serif",
    headingClass: "font-normal tracking-tight",
    sectionPad: "py-24",
    buttonClass: "rounded-none font-medium uppercase tracking-widest text-sm",
    cardClass: "rounded-none",
    eyebrow: true,
    buttonStyle: (t) => ({ backgroundColor: t.textColor, color: t.backgroundColor }),
  },
  bold: {
    name: "bold",
    font: "system-ui, -apple-system, Segoe UI, sans-serif",
    headingClass: "font-black tracking-tighter",
    sectionPad: "py-16",
    buttonClass: "rounded-none font-bold uppercase tracking-wide",
    cardClass: "rounded-none",
    eyebrow: false,
    buttonStyle: (t) => ({ backgroundColor: t.primaryColor, color: "#fff" }),
  },
  playful: {
    name: "playful",
    font: "'ui-rounded', 'SF Pro Rounded', 'Segoe UI', system-ui, sans-serif",
    headingClass: "font-extrabold tracking-tight",
    sectionPad: "py-20",
    buttonClass: "rounded-full font-bold shadow-lg",
    cardClass: "rounded-[28px]",
    eyebrow: false,
    buttonStyle: (t) => ({ backgroundColor: t.primaryColor, color: "#fff" }),
  },
  minimal: {
    name: "minimal",
    font: "system-ui, -apple-system, Segoe UI, Helvetica, sans-serif",
    headingClass: "font-medium tracking-tight",
    sectionPad: "py-28",
    buttonClass: "rounded-md font-medium",
    cardClass: "rounded-lg",
    eyebrow: true,
    buttonStyle: (t) => ({ backgroundColor: t.primaryColor, color: "#fff" }),
  },
};

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
  const hasContactSection = page.sections.some((s) => s.type === "contact");

  const linkFor = (slug: string) => {
    if (basePath === undefined) return "#";
    if (slug === "home") return basePath || "/";
    return `${basePath}/${slug}`;
  };

  // Resolve a button target ("menu", "contact", a page slug) to a real href.
  // Always returns a usable href so every button is clickable.
  const resolveHref = (target?: string): string => {
    const raw = (target || "").toLowerCase().replace(/^\/+/, "").trim();
    // On-page anchors work everywhere, including the editor preview.
    if (raw === "contact" && hasContactSection) return "#contact";
    if (raw && raw !== "home" && page.sections.some((s) => s.type === raw)) {
      return `#${raw}`;
    }
    if (basePath === undefined) return "#"; // preview: cross-page nav isn't live
    if (raw && nav?.some((n) => n.slug === raw)) return linkFor(raw);
    if (nav?.some((n) => n.slug === "contact")) return linkFor("contact");
    if (hasContactSection) return "#contact";
    return "#";
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
            <span className={tpl.eyebrow ? "text-lg font-semibold" : "text-lg font-bold"}>
              {businessName}
            </span>
          </span>
          <div className="hidden flex-wrap gap-5 text-sm sm:flex">
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

      <SiteMotion />
      <div>
        {page.sections.map((section, i) => (
          <div key={i} data-reveal={section.type === "hero" ? undefined : ""}>
            <SectionRenderer
              section={section}
              theme={t}
              tpl={tpl}
              businessName={businessName}
              resolveHref={resolveHref}
            />
          </div>
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

function Button({
  label,
  href,
  tpl,
  style,
}: {
  label: string;
  href: string;
  tpl: Tpl;
  style: CSSProperties;
}) {
  return (
    <a
      href={href}
      className={`inline-block cursor-pointer px-6 py-3 transition hover:opacity-90 ${tpl.buttonClass}`}
      style={style}
    >
      {label}
    </a>
  );
}

function SectionRenderer({
  section,
  theme,
  tpl,
  businessName,
  resolveHref,
}: {
  section: Section;
  theme: SiteTheme;
  tpl: Tpl;
  businessName: string;
  resolveHref: (target?: string) => string;
}) {
  const pad = tpl.sectionPad;

  switch (section.type) {
    case "hero": {
      // Fallback for sites generated before hero images existed: use the
      // subheadline (which describes the business) — never the headline alone,
      // which can be a made-up brand word and produce a nonsense image.
      const bg =
        section.imageUrl ||
        heroImageUrl(
          section.subheadline || `${businessName} storefront`,
          businessName + "hero"
        );
      const primaryStyle = tpl.buttonStyle(theme);
      const secondaryStyle: CSSProperties = {
        backgroundColor: "transparent",
        color: "#fff",
        border: "1.5px solid rgba(255,255,255,0.6)",
      };
      return (
        <section className="relative overflow-hidden">
          <SiteImage
            src={bg}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            fallback={{
              background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`,
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, ${theme.textColor}66 0%, ${theme.textColor}b3 100%)`,
            }}
          />
          <div className={`relative z-10 mx-auto max-w-4xl px-6 text-center ${pad}`} style={{ color: "#fff" }}>
            {section.badge && (
              <span
                className="mb-5 inline-block rounded-full px-4 py-1.5 text-sm font-medium"
                style={{ backgroundColor: theme.accentColor, color: "#fff" }}
              >
                {section.badge}
              </span>
            )}
            <h1 className={`text-4xl sm:text-6xl ${tpl.headingClass}`}>
              {section.headline}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg opacity-90">
              {section.subheadline}
            </p>
            {(section.ctaText || section.secondaryCtaText) && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                {section.ctaText && (
                  <Button
                    label={section.ctaText}
                    href={resolveHref(section.ctaTarget)}
                    tpl={tpl}
                    style={primaryStyle}
                  />
                )}
                {section.secondaryCtaText && (
                  <Button
                    label={section.secondaryCtaText}
                    href={resolveHref(section.secondaryCtaTarget)}
                    tpl={tpl}
                    style={secondaryStyle}
                  />
                )}
              </div>
            )}
            {section.highlights && section.highlights.length > 0 && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm opacity-90">
                {section.highlights.map((h, i) => (
                  <span key={i} className="flex items-center gap-1.5">
                    <span style={{ color: theme.accentColor }}>●</span>
                    {h}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>
      );
    }

    case "stats":
      return (
        <section className={`px-6 py-12`} style={{ backgroundColor: `${theme.primaryColor}0a` }}>
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 text-center sm:grid-cols-4">
            {section.items.map((s, i) => (
              <div key={i}>
                <div className={`text-3xl sm:text-4xl ${tpl.headingClass}`} style={{ color: theme.primaryColor }}>
                  {s.value}
                </div>
                <div className="mt-1 text-sm opacity-70">{s.label}</div>
              </div>
            ))}
          </div>
        </section>
      );

    case "about":
      return (
        <section className={`mx-auto max-w-3xl px-6 ${pad}`}>
          <Eyebrow tpl={tpl} theme={theme}>About</Eyebrow>
          <h2 className={`text-2xl sm:text-3xl ${tpl.headingClass}`}>{section.heading}</h2>
          <p className="mt-4 whitespace-pre-line text-lg leading-relaxed opacity-80">{section.body}</p>
        </section>
      );

    case "services":
      return (
        <section className={`mx-auto max-w-6xl px-6 ${pad}`}>
          <div className="text-center">
            <Eyebrow tpl={tpl} theme={theme}>What we offer</Eyebrow>
            <h2 className={`text-2xl sm:text-3xl ${tpl.headingClass}`}>{section.heading}</h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {section.items.map((item, i) => {
              const img = item.imageUrl || cardImageUrl(item.title, businessName + item.title);
              return (
                <div
                  key={i}
                  className={`overflow-hidden ${tpl.cardClass}`}
                  style={{ border: `1px solid ${theme.textColor}14`, backgroundColor: theme.backgroundColor }}
                >
                  <div className="relative aspect-[4/3]">
                    <SiteImage
                      src={img}
                      alt={item.title}
                      className="absolute inset-0 h-full w-full object-cover"
                      fallback={{
                        background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`,
                      }}
                    />
                    {item.badge && (
                      <span
                        className="absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold text-white"
                        style={{ backgroundColor: theme.primaryColor }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-semibold">{item.title}</h3>
                      {item.price && (
                        <span className="shrink-0 font-bold" style={{ color: theme.primaryColor }}>{item.price}</span>
                      )}
                    </div>
                    <p className="mt-2 text-sm opacity-75">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      );

    case "features":
      return (
        <section className={`mx-auto max-w-5xl px-6 ${pad}`}>
          <div className="text-center">
            <Eyebrow tpl={tpl} theme={theme}>Why us</Eyebrow>
            <h2 className={`text-2xl sm:text-3xl ${tpl.headingClass}`}>{section.heading}</h2>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {section.items.map((item, i) => (
              <div
                key={i}
                className={`p-6 ${tpl.cardClass}`}
                style={{ border: `1px solid ${theme.textColor}14` }}
              >
                <div className="mb-3 h-1.5 w-10 rounded-full" style={{ backgroundColor: theme.accentColor }} />
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm opacity-80">{item.description}</p>
              </div>
            ))}
          </div>
        </section>
      );

    case "testimonials":
      return (
        <section className={`px-6 ${pad}`} style={{ backgroundColor: `${theme.primaryColor}0d` }}>
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <Eyebrow tpl={tpl} theme={theme}>Testimonials</Eyebrow>
              <h2 className={`text-2xl sm:text-3xl ${tpl.headingClass}`}>{section.heading}</h2>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {section.items.map((item, i) => (
                <figure key={i} className={`p-6 ${tpl.cardClass}`} style={{ backgroundColor: theme.backgroundColor, border: `1px solid ${theme.textColor}14` }}>
                  <blockquote className="text-lg italic opacity-90">“{item.quote}”</blockquote>
                  <figcaption className="mt-3 text-sm font-medium opacity-70">— {item.author}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      );

    case "gallery":
      return (
        <section className={`mx-auto max-w-5xl px-6 ${pad}`}>
          <div className="text-center">
            <h2 className={`text-2xl sm:text-3xl ${tpl.headingClass}`}>{section.heading}</h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {section.items.map((item, i) => (
              <div key={i} className={`relative aspect-video overflow-hidden ${tpl.cardClass}`}>
                <SiteImage
                  src={item.imageUrl || galleryImageUrl(item.caption, businessName)}
                  alt={item.caption}
                  className="absolute inset-0 h-full w-full object-cover"
                  fallback={{
                    background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`,
                  }}
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
          style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`, color: "#fff" }}
        >
          <h2 className={`text-2xl sm:text-4xl ${tpl.headingClass}`}>{section.heading}</h2>
          <p className="mx-auto mt-3 max-w-xl opacity-90">{section.body}</p>
          <div className="mt-6">
            <Button
              label={section.buttonText}
              href={resolveHref(section.buttonTarget)}
              tpl={tpl}
              style={{ backgroundColor: "#fff", color: theme.primaryColor }}
            />
          </div>
        </section>
      );

    case "contact":
      return (
        <section id="contact" className={`mx-auto max-w-3xl px-6 ${pad}`}>
          <Eyebrow tpl={tpl} theme={theme}>Contact</Eyebrow>
          <h2 className={`text-2xl sm:text-3xl ${tpl.headingClass}`}>{section.heading}</h2>
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
