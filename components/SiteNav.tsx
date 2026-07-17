"use client";

import { useState } from "react";

export interface NavLink {
  title: string;
  slug: string;
  href: string;
}

// Site header: business name + desktop links, and a hamburger (3 lines) menu on
// mobile so visitors can reach the pages on a published site.
export function SiteNav({
  businessName,
  logoUrl,
  links,
  textColor,
  backgroundColor,
  bold,
}: {
  businessName: string;
  logoUrl?: string;
  links: NavLink[];
  textColor: string;
  backgroundColor: string;
  bold: boolean;
}) {
  const [open, setOpen] = useState(false);
  const border = `1px solid ${textColor}1a`;

  return (
    <nav
      className="relative flex items-center justify-between px-6 py-4"
      style={{ borderBottom: border }}
    >
      <span className="flex items-center gap-2.5">
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt=""
            className="h-9 w-9 rounded-md object-contain"
          />
        )}
        <span className={bold ? "text-lg font-bold" : "text-lg font-semibold"}>
          {businessName}
        </span>
      </span>

      {links.length > 0 && (
        <>
          <div className="hidden flex-wrap gap-5 text-sm sm:flex">
            {links.map((l) => (
              <a
                key={l.slug}
                href={l.href}
                className="opacity-70 transition-opacity hover:opacity-100"
              >
                {l.title}
              </a>
            ))}
          </div>

          <button
            type="button"
            aria-label="Menu"
            onClick={() => setOpen((o) => !o)}
            className="flex flex-col gap-[5px] p-1 sm:hidden"
            style={{ color: textColor }}
          >
            <span className="block h-0.5 w-6 rounded-full bg-current" />
            <span className="block h-0.5 w-6 rounded-full bg-current" />
            <span className="block h-0.5 w-6 rounded-full bg-current" />
          </button>

          {open && (
            <div
              className="absolute inset-x-0 top-full z-30 flex flex-col px-6 py-2 sm:hidden"
              style={{ backgroundColor, borderBottom: border }}
            >
              {links.map((l) => (
                <a
                  key={l.slug}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="border-t py-3 text-sm opacity-80 first:border-t-0"
                  style={{ borderColor: `${textColor}14` }}
                >
                  {l.title}
                </a>
              ))}
            </div>
          )}
        </>
      )}
    </nav>
  );
}
