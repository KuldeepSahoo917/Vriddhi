import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDb } from './config/db.js';
import { calculateRouter } from './routes/calculate.js';
import { authRouter } from './routes/auth.js';
import { scenariosRouter } from './routes/scenarios.js';
import { advisorRouter } from './routes/advisor.js';

const app = express();
const PORT = process.env.PORT ?? 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173';

// Almost every hosting platform (Render, Vercel, Railway...) sits
// behind a reverse proxy. Without this, express-rate-limit can't
// correctly read the real client IP from X-Forwarded-For and either
// throws or rate-limits every user as if they share one IP.
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Generous general limit; auth routes get a tighter one below to slow
// down credential-stuffing / brute force attempts specifically.
const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20 });
// Advisor calls cost real money per request — capped far tighter than
// general API traffic. 20 questions per 15 minutes is generous for a
// real user, punishing for a runaway loop or abuse.
const advisorLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20 });

app.use(generalLimiter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/calculate', calculateRouter);
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/scenarios', scenariosRouter);
app.use('/api/advisor', advisorLimiter, advisorRouter);

async function start() {
  await connectDb();
  app.listen(PORT, () => {
    console.log(`Vriddhi backend listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
