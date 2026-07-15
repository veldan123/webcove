"use client";

import { useState, type CSSProperties } from "react";

/**
 * An <img> that tolerates flaky image hosts (Pollinations can throttle when a
 * page requests many images at once). On error it retries a couple of times,
 * then falls back to a clean gradient tile instead of a broken-image icon.
 */
export function SiteImage({
  src,
  alt,
  className,
  fallback,
}: {
  src: string;
  alt: string;
  className?: string;
  fallback: CSSProperties;
}) {
  const [tries, setTries] = useState(0);
  const [dead, setDead] = useState(false);

  if (dead) {
    return <div className={className} style={fallback} aria-label={alt} />;
  }

  const url =
    tries === 0
      ? src
      : `${src}${src.includes("?") ? "&" : "?"}retry=${tries}`;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={url}
      src={url}
      alt={alt}
      loading="lazy"
      className={className}
      onError={() => {
        if (tries < 2) window.setTimeout(() => setTries((t) => t + 1), 1500);
        else setDead(true);
      }}
    />
  );
}
