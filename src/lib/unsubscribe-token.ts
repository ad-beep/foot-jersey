import crypto from 'crypto';

// Unsubscribe links are signed with an HMAC so they can't be forged or used to
// enumerate which emails exist in the system. The signing key is a server-only
// secret (reuses CRON_SECRET, which is already required for the marketing crons).
function getSecret(): string {
  return process.env.UNSUBSCRIBE_SECRET || process.env.CRON_SECRET || '';
}

function sign(email: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(email).digest('base64url').slice(0, 24);
}

/** Build a signed unsubscribe token: base64url(email).hmac */
export function signUnsubscribeToken(email: string): string {
  const normalized = email.trim().toLowerCase();
  const payload = Buffer.from(normalized, 'utf8').toString('base64url');
  return `${payload}.${sign(normalized, getSecret())}`;
}

/** Verify a signed unsubscribe token; returns the email if valid, else null. */
export function verifyUnsubscribeToken(token: string): string | null {
  const dot = token.lastIndexOf('.');
  if (dot < 0) return null;
  const payload = token.slice(0, dot);
  const providedSig = token.slice(dot + 1);

  let email: string;
  try {
    email = Buffer.from(payload, 'base64url').toString('utf8');
  } catch {
    return null;
  }
  if (!email.includes('@')) return null;

  const expectedSig = sign(email, getSecret());
  if (providedSig.length !== expectedSig.length) return null;
  try {
    if (!crypto.timingSafeEqual(Buffer.from(providedSig), Buffer.from(expectedSig))) return null;
  } catch {
    return null;
  }
  return email;
}
