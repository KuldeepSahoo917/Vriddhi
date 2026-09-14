import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/User.js';
import {
  registerSchema,
  loginSchema,
  googleAuthSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.schemas.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/tokens.js';
import { generateResetToken, hashResetToken } from '../utils/resetToken.js';
import { sendPasswordResetEmail } from '../services/email.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const authRouter = Router();

const REFRESH_COOKIE_NAME = 'vriddhi_refresh';

// In production, the frontend and backend almost always live on
// different domains (e.g. Vercel + Render) — that's a cross-site
// request from the cookie's perspective, which requires
// sameSite:'none', and browsers require secure:true whenever
// sameSite is 'none'. Locally, both run on http://localhost, so we
// keep 'lax'/insecure — secure:true would silently break cookie
// setting over plain HTTP in local dev.
const isProduction = process.env.NODE_ENV === 'production';
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days, matches refresh token TTL
  path: '/api/auth', // only sent to auth routes, not the whole app
};

function publicUser(user: { _id: unknown; name: string; email: string }) {
  return { id: String(user._id), name: user.name, email: user.email };
}

authRouter.post('/register', async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { name, email, password } = parsed.data;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ error: { formErrors: ['An account with this email already exists.'] } });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash });

  const accessToken = signAccessToken({ userId: String(user._id) });
  const refreshToken = signRefreshToken({ userId: String(user._id) });
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);

  res.status(201).json({ user: publicUser(user), accessToken });
});

authRouter.post('/login', async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { email, password } = parsed.data;

  const user = await User.findOne({ email });

  if (user && !user.passwordHash) {
    return res.status(401).json({
      error: { formErrors: ['This account uses Google sign-in. Continue with Google instead.'] },
    });
  }

  const passwordMatches = user?.passwordHash
    ? await bcrypt.compare(password, user.passwordHash)
    : false;

  if (!user || !passwordMatches) {
    return res.status(401).json({ error: { formErrors: ['Incorrect email or password.'] } });
  }

  const accessToken = signAccessToken({ userId: String(user._id) });
  const refreshToken = signRefreshToken({ userId: String(user._id) });
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);

  res.json({ user: publicUser(user), accessToken });
});

authRouter.post('/google', async (req: Request, res: Response) => {
  const parsed = googleAuthSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(500).json({ error: 'Google sign-in is not configured on this server.' });
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: parsed.data.credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    return res.status(401).json({ error: 'Could not verify Google sign-in. Try again.' });
  }

  if (!payload?.email || !payload.sub) {
    return res.status(401).json({ error: 'Could not verify Google sign-in. Try again.' });
  }

  // Find by googleId first, then fall back to email — this lets an
  // existing email/password account link to Google on first Google
  // sign-in instead of creating a duplicate account.
  let linked = false;
  let user = await User.findOne({ googleId: payload.sub });
  if (!user) {
    user = await User.findOne({ email: payload.email });
    if (user) {
      user.googleId = payload.sub;
      await user.save();
      linked = true;
    }
  }
  if (!user) {
    const derivedName = payload.name ?? payload.email.split('@')[0] ?? 'Vriddhi user';
    user = await User.create({
      email: payload.email,
      name: derivedName,
      googleId: payload.sub,
    });
  }

  const accessToken = signAccessToken({ userId: String(user._id) });
  const refreshToken = signRefreshToken({ userId: String(user._id) });
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);

  res.json({ user: publicUser(user), accessToken, linked });
});

authRouter.post('/refresh', async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: 'No refresh token.' });
  }

  try {
    const payload = verifyRefreshToken(token);
    const accessToken = signAccessToken({ userId: payload.userId });
    res.json({ accessToken });
  } catch {
    res.clearCookie(REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS);
    res.status(401).json({ error: 'Session expired. Sign in again.' });
  }
});

authRouter.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie(REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS);
  res.status(204).send();
});

authRouter.get('/me', requireAuth, async (req: AuthedRequest, res: Response) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ user: publicUser(user) });
});

authRouter.post('/forgot-password', async (req: Request, res: Response) => {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const user = await User.findOne({ email: parsed.data.email });

  // Always respond the same way whether or not the email exists —
  // otherwise this endpoint becomes a way to check which emails have
  // accounts (user enumeration).
  const genericResponse = {
    message: "If an account exists for that email, we've sent a reset link.",
  };

  if (!user || !user.passwordHash) {
    // No account, or a Google-only account with no password to reset.
    // Same response either way — don't leak which case it was.
    return res.json(genericResponse);
  }

  const { token, tokenHash, expires } = generateResetToken();
  user.resetPasswordTokenHash = tokenHash;
  user.resetPasswordExpires = expires;
  await user.save();

  const frontendOrigin = process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173';
  const resetUrl = `${frontendOrigin}/reset-password?token=${token}`;

  try {
    await sendPasswordResetEmail(user.email, resetUrl);
  } catch (err) {
    console.error('Failed to send reset email:', err);
    // Still return the generic success response — don't reveal
    // delivery failures to the client, and don't block the user with
    // an error for something on our end.
  }

  res.json(genericResponse);
});

authRouter.post('/reset-password', async (req: Request, res: Response) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const tokenHash = hashResetToken(parsed.data.token);
  const user = await User.findOne({
    resetPasswordTokenHash: tokenHash,
    resetPasswordExpires: { $gt: new Date() },
  });

  if (!user) {
    return res.status(400).json({
      error: { formErrors: ['This reset link is invalid or has expired. Request a new one.'] },
    });
  }

  user.passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  user.resetPasswordTokenHash = null;
  user.resetPasswordExpires = null;
  await user.save();

  res.json({ message: 'Your password has been reset. You can now log in.' });
});
