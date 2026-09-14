import jwt from 'jsonwebtoken';

export interface TokenPayload {
  userId: string;
}

function getSecret(name: 'ACCESS' | 'REFRESH'): string {
  const secret = process.env[`JWT_${name}_SECRET`];
  if (!secret) {
    throw new Error(`JWT_${name}_SECRET is not set. Copy .env.example to .env.`);
  }
  return secret;
}

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '30d';

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, getSecret('ACCESS'), { expiresIn: ACCESS_TOKEN_TTL });
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, getSecret('REFRESH'), { expiresIn: REFRESH_TOKEN_TTL });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, getSecret('ACCESS')) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, getSecret('REFRESH')) as TokenPayload;
}
