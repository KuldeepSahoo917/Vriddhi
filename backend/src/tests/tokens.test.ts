import { describe, it, expect, beforeAll } from 'vitest';
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../utils/tokens.js';

beforeAll(() => {
  process.env.JWT_ACCESS_SECRET = 'test-access-secret';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
});

describe('access tokens', () => {
  it('round-trips the payload through sign and verify', () => {
    const token = signAccessToken({ userId: 'user123' });
    const payload = verifyAccessToken(token);
    expect(payload.userId).toBe('user123');
  });

  it('rejects a token signed with the refresh secret', () => {
    const refreshToken = signRefreshToken({ userId: 'user123' });
    expect(() => verifyAccessToken(refreshToken)).toThrow();
  });

  it('rejects a garbage token', () => {
    expect(() => verifyAccessToken('not-a-real-token')).toThrow();
  });
});

describe('refresh tokens', () => {
  it('round-trips the payload through sign and verify', () => {
    const token = signRefreshToken({ userId: 'user456' });
    const payload = verifyRefreshToken(token);
    expect(payload.userId).toBe('user456');
  });

  it('rejects a token signed with the access secret', () => {
    const accessToken = signAccessToken({ userId: 'user456' });
    expect(() => verifyRefreshToken(accessToken)).toThrow();
  });
});
