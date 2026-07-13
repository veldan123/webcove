import "server-only";
import { Resend } from "resend";

// Resend chosen over Postmark: simplest DX for a Next.js/Vercel stack, first-
// class React email support, and a generous free tier for low-volume outreach.

let _resend: Resend | null = null;
export function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not set");
    _resend = new Resend(key);
  }
  return _resend;
}

export function fromAddress(): string {
  return process.env.RESEND_FROM_EMAIL || "Webcove <onboarding@resend.dev>";
}
