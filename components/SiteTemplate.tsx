import type { PageContent, Section, SiteTheme } from "@/lib/types";

const DEFAULT_THEME: SiteTheme = {
  primaryColor: "#2563eb",
  accentColor: "#7c3aed",
  backgroundColor: "#ffffff",
  textColor: "#0f172a",
  fontFamily: "sans",
};

export interface SiteNavItem {
  title: string;
  slug: string;
}

/**
 * Shared renderer for a generated site page. Used by BOTH the workspace live
 * preview and the public `/[slug]` route so previews match the published site.
 * Pure/server-safe — no client hooks.
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
  // Prefix for nav links, e.g. "/acme-co" on the public site. Omit for preview.
  basePath?: string;
}) {
  const t = { ...DEFAULT_THEME, ...(theme ?? {}) };
  const fontClass = t.fontFamily === "serif" ? "font-serif" : "font-sans";

  return (
    <div
      className={fontClass}
      style={{
        backgroundColor: t.backgroundColor,
        color: t.textColor,
        // expose theme colors to section styles
        ["--site-primary" as string]: t.primaryColor,
        ["--site-accent" as string]: t.accentColor,
      }}
    >
      {nav && nav.length > 0 && (
        <nav
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: `1px solid ${t.textColor}1a` }}
        >
          <span className="font-semibold">{businessName}</span>
          <div className="flex flex-wrap gap-4 text-sm">
            {nav.map((item) => (
              <a
                key={item.slug}
                href={
                  basePath
                    ? item.slug === "home"
                      ? basePath
                      : `${basePath}/${item.slug}`
                    : "#"
                }
                className="opacity-70 hover:opacity-100"
              >
                {item.title}
              </a>
            ))}
          </div>
        </nav>
      )}

      <div>
        {page.sections.map((section, i) => (
          <SectionRenderer key={i} section={section} theme={t} />
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

function SectionRenderer({
  section,
  theme,
}: {
  section: Section;
  theme: SiteTheme;
}) {
  switch (section.type) {
    case "hero":
      return (
        <section
          className="px-6 py-20 text-center"
          style={{
            background: `linear-gradient(135deg, ${theme.primaryColor}14, ${theme.accentColor}14)`,
          }}
        >
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            {section.headline}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg opacity-75">
            {section.subheadline}
          </p>
          {section.ctaText && (
            <span
              className="mt-8 inline-block rounded-lg px-6 py-3 font-medium text-white"
              style={{ backgroundColor: theme.primaryColor }}
            >
              {section.ctaText}
            </span>
          )}
        </section>
      );

    case "about":
      return (
        <section className="mx-auto max-w-3xl px-6 py-16">
          <h2 className="text-2xl font-semibold">{section.heading}</h2>
          <p className="mt-4 whitespace-pre-line leading-relaxed opacity-80">
            {section.body}
          </p>
        </section>
      );

    case "services":
    case "features":
      return (
        <section className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-center text-2xl font-semibold">
            {section.heading}
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {section.items.map((item, i) => (
              <div
                key={i}
                className="rounded-xl p-6"
                style={{ border: `1px solid ${theme.textColor}1a` }}
              >
                <div
                  className="mb-3 h-1.5 w-8 rounded-full"
                  style={{ backgroundColor: theme.accentColor }}
                />
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm opacity-75">{item.description}</p>
              </div>
            ))}
          </div>
        </section>
      );

    case "testimonials":
      return (
        <section
          className="px-6 py-16"
          style={{ backgroundColor: `${theme.primaryColor}0a` }}
        >
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-2xl font-semibold">
              {section.heading}
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {section.items.map((item, i) => (
                <figure
                  key={i}
                  className="rounded-xl p-6"
                  style={{ border: `1px solid ${theme.textColor}1a` }}
                >
                  <blockquote className="italic opacity-85">
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
        <section className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-center text-2xl font-semibold">
            {section.heading}
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {section.items.map((item, i) => (
              <div
                key={i}
                className="flex aspect-video items-end rounded-xl p-4 text-sm text-white"
                style={{
                  background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`,
                }}
              >
                {item.caption}
              </div>
            ))}
          </div>
        </section>
      );

    case "cta":
      return (
        <section
          className="px-6 py-16 text-center text-white"
          style={{
            background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`,
          }}
        >
          <h2 className="text-2xl font-semibold">{section.heading}</h2>
          <p className="mx-auto mt-3 max-w-xl opacity-90">{section.body}</p>
          <span className="mt-6 inline-block rounded-lg bg-white px-6 py-3 font-medium text-black">
            {section.buttonText}
          </span>
        </section>
      );

    case "contact":
      return (
        <section className="mx-auto max-w-3xl px-6 py-16">
          <h2 className="text-2xl font-semibold">{section.heading}</h2>
          {section.body && (
            <p className="mt-3 opacity-80">{section.body}</p>
          )}
          <div className="mt-6 space-y-2 text-sm opacity-80">
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
