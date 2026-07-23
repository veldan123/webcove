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
import { SiteNav } from "@/components/SiteNav";

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
  showBranding = true,
}: {
  theme?: SiteTheme | null;
  businessName: string;
  page: PageContent;
  nav?: SiteNavItem[];
  basePath?: string;
  showBranding?: boolean;
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
        <SiteNav
          businessName={businessName}
          logoUrl={t.logoUrl}
          links={nav.map((item) => ({
            title: item.title,
            slug: item.slug,
            href: linkFor(item.slug),
          }))}
          textColor={t.textColor}
          backgroundColor={t.backgroundColor}
          bold={!tpl.eyebrow}
        />
      )}

      <SiteMotion />
      <div>
        {page.sections.map((section, i) => (
          <div key={i}>
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
        className="px-6 py-8 text-center text-sm"
        style={{ borderTop: `1px solid ${t.textColor}1a` }}
      >
        <span className="opacity-60">
          © {new Date().getFullYear()} {businessName}
        </span>
        {showBranding && (
          <div className="mt-3">
            <a
              href="https://webcove.io?utm_source=badge&utm_medium=site"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium opacity-80 transition hover:opacity-100"
              style={{
                border: `1px solid ${t.textColor}22`,
                color: t.textColor,
              }}
            >
              <span aria-hidden>⚡</span> Built with Webcove
            </a>
          </div>
        )}
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
      className={`inline-block cursor-pointer px-7 py-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:opacity-95 hover:shadow-xl ${tpl.buttonClass}`}
      style={style}
    >
      {label}
    </a>
  );
}

// `data-reveal` + an optional stagger delay, spread onto an element.
function reveal(delayMs = 0): {
  "data-reveal": "";
  style?: CSSProperties;
} {
  return delayMs
    ? { "data-reveal": "", style: { "--wc-delay": `${delayMs}ms` } as CSSProperties }
    : { "data-reveal": "" };
}

function Stars({ color }: { color: string }) {
  return (
    <div aria-hidden className="mb-3 flex gap-0.5" style={{ color }}>
      {"★★★★★".split("").map((s, i) => (
        <span key={i}>{s}</span>
      ))}
    </div>
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
        backgroundColor: "rgba(255,255,255,0.12)",
        color: "#fff",
        border: "1.5px solid rgba(255,255,255,0.55)",
        backdropFilter: "blur(6px)",
      };
      return (
        <section className="relative flex min-h-[560px] items-center overflow-hidden sm:min-h-[82vh]">
          <div className="absolute inset-0 overflow-hidden">
            <SiteImage
              src={bg}
              alt=""
              className="wc-kenburns absolute inset-0 h-full w-full object-cover"
              fallback={{
                background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`,
              }}
            />
          </div>
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, ${theme.textColor}4d 0%, ${theme.textColor}a6 55%, ${theme.textColor}d9 100%)`,
            }}
          />
          {/* floating colour orbs for depth */}
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              className="wc-float absolute -left-16 top-[15%] h-64 w-64 rounded-full opacity-30 blur-3xl"
              style={{ background: theme.primaryColor }}
            />
            <div
              className="wc-float-slow absolute -right-12 bottom-[12%] h-72 w-72 rounded-full opacity-25 blur-3xl"
              style={{ background: theme.accentColor }}
            />
          </div>

          <div
            className="relative z-10 mx-auto w-full max-w-4xl px-6 py-24 text-center"
            style={{ color: "#fff" }}
          >
            {section.badge && (
              <span
                {...reveal()}
                className="mb-6 inline-block rounded-full border border-white/25 bg-white/15 px-4 py-1.5 text-sm font-medium backdrop-blur-sm"
              >
                {section.badge}
              </span>
            )}
            <h1
              {...reveal(80)}
              className={`text-4xl leading-[1.05] sm:text-6xl ${tpl.headingClass}`}
              style={{ textShadow: "0 2px 30px rgba(0,0,0,0.35)" }}
            >
              {section.headline}
            </h1>
            <p
              {...reveal(160)}
              className="mx-auto mt-6 max-w-2xl text-lg opacity-95 sm:text-xl"
            >
              {section.subheadline}
            </p>
            {(section.ctaText || section.secondaryCtaText) && (
              <div
                {...reveal(240)}
                className="mt-9 flex flex-wrap items-center justify-center gap-3"
              >
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
              <div
                {...reveal(320)}
                className="mt-9 flex flex-wrap items-center justify-center gap-2.5 text-sm"
              >
                {section.highlights.map((h, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 backdrop-blur-sm"
                  >
                    <span style={{ color: theme.accentColor }}>●</span>
                    {h}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div
            aria-hidden
            className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/85"
          >
            <svg
              className="wc-bounce h-7 w-7"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </section>
      );
    }

    case "stats":
      return (
        <section className="px-6 py-16" style={{ backgroundColor: `${theme.primaryColor}0a` }}>
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-x-8 gap-y-10 text-center sm:grid-cols-4">
            {section.items.map((s, i) => (
              <div key={i} {...reveal(i * 90)}>
                <div
                  className={`text-4xl sm:text-5xl ${tpl.headingClass}`}
                  style={{ color: theme.primaryColor }}
                >
                  {s.value}
                </div>
                <div className="mt-2 text-sm font-medium opacity-70">{s.label}</div>
              </div>
            ))}
          </div>
        </section>
      );

    case "about":
      return (
        <section className={`mx-auto max-w-3xl px-6 ${pad}`}>
          <div {...reveal()}>
            <Eyebrow tpl={tpl} theme={theme}>About</Eyebrow>
            <h2 className={`text-3xl sm:text-4xl ${tpl.headingClass}`}>{section.heading}</h2>
            <div className="mt-5 h-1 w-16 rounded-full" style={{ backgroundColor: theme.accentColor }} />
            <p className="mt-6 whitespace-pre-line text-lg leading-relaxed opacity-80">{section.body}</p>
          </div>
        </section>
      );

    case "services":
      return (
        <section className={`mx-auto max-w-6xl px-6 ${pad}`}>
          <div className="text-center" {...reveal()}>
            <Eyebrow tpl={tpl} theme={theme}>What we offer</Eyebrow>
            <h2 className={`text-3xl sm:text-4xl ${tpl.headingClass}`}>{section.heading}</h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {section.items.map((item, i) => {
              const img = item.imageUrl || cardImageUrl(item.title, businessName + item.title);
              return (
                <div
                  key={i}
                  data-reveal=""
                  className={`group overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl ${tpl.cardClass}`}
                  style={{
                    border: `1px solid ${theme.textColor}14`,
                    backgroundColor: theme.backgroundColor,
                    "--wc-delay": `${i * 70}ms`,
                  } as CSSProperties}
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <SiteImage
                      src={img}
                      alt={item.title}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-110"
                      fallback={{
                        background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`,
                      }}
                    />
                    {item.badge && (
                      <span
                        className="absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold text-white shadow-md"
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
                    <p className="mt-2 text-sm leading-relaxed opacity-75">{item.description}</p>
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
          <div className="text-center" {...reveal()}>
            <Eyebrow tpl={tpl} theme={theme}>Why us</Eyebrow>
            <h2 className={`text-3xl sm:text-4xl ${tpl.headingClass}`}>{section.heading}</h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {section.items.map((item, i) => (
              <div
                key={i}
                data-reveal=""
                className={`group p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${tpl.cardClass}`}
                style={{
                  border: `1px solid ${theme.textColor}14`,
                  "--wc-delay": `${i * 70}ms`,
                } as CSSProperties}
              >
                <div
                  className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-lg font-bold text-white transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})` }}
                >
                  {i + 1}
                </div>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed opacity-80">{item.description}</p>
              </div>
            ))}
          </div>
        </section>
      );

    case "testimonials":
      return (
        <section className={`px-6 ${pad}`} style={{ backgroundColor: `${theme.primaryColor}0d` }}>
          <div className="mx-auto max-w-5xl">
            <div className="text-center" {...reveal()}>
              <Eyebrow tpl={tpl} theme={theme}>Testimonials</Eyebrow>
              <h2 className={`text-3xl sm:text-4xl ${tpl.headingClass}`}>{section.heading}</h2>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              {section.items.map((item, i) => (
                <figure
                  key={i}
                  data-reveal=""
                  className={`p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${tpl.cardClass}`}
                  style={{
                    backgroundColor: theme.backgroundColor,
                    border: `1px solid ${theme.textColor}14`,
                    "--wc-delay": `${i * 80}ms`,
                  } as CSSProperties}
                >
                  <Stars color={theme.accentColor} />
                  <blockquote className="text-lg italic leading-relaxed opacity-90">“{item.quote}”</blockquote>
                  <figcaption className="mt-4 flex items-center gap-3">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})` }}
                    >
                      {item.author.trim().charAt(0).toUpperCase()}
                    </span>
                    <span className="text-sm font-semibold opacity-80">{item.author}</span>
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
          <div className="text-center" {...reveal()}>
            <h2 className={`text-3xl sm:text-4xl ${tpl.headingClass}`}>{section.heading}</h2>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {section.items.map((item, i) => (
              <div
                key={i}
                data-reveal=""
                className={`group relative aspect-square overflow-hidden ${tpl.cardClass}`}
                style={{ "--wc-delay": `${i * 60}ms` } as CSSProperties}
              >
                <SiteImage
                  src={item.imageUrl || galleryImageUrl(item.caption, businessName)}
                  alt={item.caption}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-110"
                  fallback={{
                    background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="absolute inset-x-0 bottom-0 translate-y-1 p-4 text-sm font-medium text-white transition-transform duration-300 group-hover:translate-y-0">
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
          className={`wc-anim-gradient px-6 text-center ${pad}`}
          style={{
            backgroundImage: `linear-gradient(120deg, ${theme.primaryColor}, ${theme.accentColor}, ${theme.primaryColor})`,
            color: "#fff",
          }}
        >
          <div {...reveal()}>
            <h2 className={`text-3xl sm:text-5xl ${tpl.headingClass}`}>{section.heading}</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg opacity-95">{section.body}</p>
            <div className="mt-8">
              <Button
                label={section.buttonText}
                href={resolveHref(section.buttonTarget)}
                tpl={tpl}
                style={{ backgroundColor: "#fff", color: theme.primaryColor }}
              />
            </div>
          </div>
        </section>
      );

    case "contact":
      return (
        <section id="contact" className={`mx-auto max-w-3xl px-6 ${pad}`}>
          <div {...reveal()}>
            <Eyebrow tpl={tpl} theme={theme}>Contact</Eyebrow>
            <h2 className={`text-3xl sm:text-4xl ${tpl.headingClass}`}>{section.heading}</h2>
            {section.body && <p className="mt-4 text-lg opacity-80">{section.body}</p>}
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                section.phone && { icon: "📞", value: section.phone },
                section.email && { icon: "✉️", value: section.email },
                section.address && { icon: "📍", value: section.address },
              ]
                .filter(Boolean)
                .map((c, i) => {
                  const item = c as { icon: string; value: string };
                  return (
                    <div
                      key={i}
                      className={`p-5 text-center ${tpl.cardClass}`}
                      style={{ border: `1px solid ${theme.textColor}14` }}
                    >
                      <div className="text-2xl">{item.icon}</div>
                      <div className="mt-2 text-sm opacity-80">{item.value}</div>
                    </div>
                  );
                })}
            </div>
          </div>
        </section>
      );

    default:
      return null;
  }
}
