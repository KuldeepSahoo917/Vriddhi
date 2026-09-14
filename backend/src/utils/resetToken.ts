import { randomBytes, createHash } from 'crypto';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export interface GeneratedResetToken {
  /** The raw token — goes in the email link, never stored. */
  token: string;
  /** Stored in the DB, used to look up and verify the raw token later. */
  tokenHash: string;
  expires: Date;
}

export function generateResetToken(): GeneratedResetToken {
  const token = randomBytes(32).toString('hex');
  return {
    token,
    tokenHash: hashResetToken(token),
    expires: new Date(Date.now() + RESET_TOKEN_TTL_MS),
  };
}

export function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
