// Prefer server-only ADMIN_EMAILS (not exposed to browser bundle).
// Fall back to NEXT_PUBLIC_ADMIN_EMAILS so existing deployments still work.
// To harden: set ADMIN_EMAILS in Vercel env (no NEXT_PUBLIC_ prefix) and
// leave NEXT_PUBLIC_ADMIN_EMAILS unset so the list is never shipped to clients.
const ADMIN_EMAILS = (
  process.env.ADMIN_EMAILS ?? process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? ''
).split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
