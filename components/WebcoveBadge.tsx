/**
 * Sticky "Built with Webcove" badge shown on published sites. Fixed to the
 * bottom of the viewport so it stays visible the whole way down the page.
 * Owners can pay a one-time fee to remove it (see /api/sites/[siteId]/remove-branding).
 */
export function WebcoveBadge() {
  return (
    <a
      href="https://webcove.io?utm_source=badge&utm_medium=site"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Built with Webcove"
      style={{
        position: "fixed",
        bottom: "18px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 2147483000,
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "10px 18px",
        borderRadius: "9999px",
        border: "2px solid #000",
        borderBottom: "4px solid #000",
        background: "#fff",
        color: "#000",
        fontSize: "14px",
        fontWeight: 700,
        lineHeight: 1,
        textDecoration: "none",
        boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        whiteSpace: "nowrap",
      }}
    >
      <span aria-hidden>⚡</span>
      Built with Webcove
    </a>
  );
}
