// Accounts allowed to switch their plan instantly (no Stripe) for testing.
// The gate is enforced SERVER-SIDE in /api/dev/set-plan using the session email;
// the client only uses this to decide whether to show the switcher.
export const TEST_ACCOUNT_EMAILS = ["veldanleeyh@gmail.com"];

export function isTestAccount(email?: string | null): boolean {
  return !!email && TEST_ACCOUNT_EMAILS.includes(email.trim().toLowerCase());
}
