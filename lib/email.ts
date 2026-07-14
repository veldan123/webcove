import "server-only";
import { getResend, fromAddress } from "./resend";

const SHELL = (inner: string) => `
<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f6f6fb;padding:32px 0;">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #eceaf5;">
    <div style="background:linear-gradient(135deg,#5b34d6,#8a4fe6);padding:24px 28px;">
      <span style="color:#fff;font-size:18px;font-weight:700;letter-spacing:-0.02em;">Webcove</span>
    </div>
    <div style="padding:28px;color:#1f2430;font-size:15px;line-height:1.6;">
      ${inner}
    </div>
    <div style="padding:16px 28px;border-top:1px solid #f0eef7;color:#9a97ab;font-size:12px;">
      Webcove · AI website builder
    </div>
  </div>
</div>`;

/** Sends the 4-digit verification code for a manual sign-up. */
export async function sendVerificationCodeEmail(
  to: string,
  code: string,
  name?: string
) {
  const html = SHELL(`
    <p style="margin:0 0 12px;">Hi${name ? " " + escapeHtml(name) : ""},</p>
    <p style="margin:0 0 20px;">Welcome to Webcove! Enter this code to confirm your email:</p>
    <div style="text-align:center;margin:8px 0 24px;">
      <span style="display:inline-block;font-size:38px;font-weight:800;letter-spacing:12px;color:#5b34d6;background:#f2eefc;border-radius:12px;padding:14px 20px 14px 32px;">${escapeHtml(code)}</span>
    </div>
    <p style="margin:0;color:#6b6880;font-size:13px;">This code expires in 10 minutes. If you didn't sign up for Webcove, you can ignore this email.</p>
  `);
  return getResend().emails.send({
    from: fromAddress(),
    to,
    subject: `Your Webcove verification code: ${code}`,
    html,
  });
}

/** Sends a thank-you email after someone subscribes to a plan. */
export async function sendPlanThankYouEmail(
  to: string,
  planLabel: string,
  name?: string
) {
  const html = SHELL(`
    <p style="margin:0 0 12px;">Thank you${name ? " " + escapeHtml(name) : ""}! 🎉</p>
    <p style="margin:0 0 16px;">Your <strong>Webcove ${escapeHtml(planLabel)}</strong> plan is now active. You can publish your sites live whenever you're ready.</p>
    <div style="text-align:center;margin:20px 0 8px;">
      <a href="https://www.webcove.io/dashboard" style="display:inline-block;background:#5b34d6;color:#fff;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:10px;">Go to your dashboard</a>
    </div>
    <p style="margin:16px 0 0;color:#6b6880;font-size:13px;">Need anything? Just reply to this email.</p>
  `);
  return getResend().emails.send({
    from: fromAddress(),
    to,
    subject: `Welcome to Webcove ${planLabel} — you're all set`,
    html,
  });
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!
  );
}
