# Vriddhi — every rupee, accounted for

A financial literacy and planning tool: four interactive calculators
(compound interest, SIP, loan/EMI, retirement), user accounts with
saved and comparable scenarios, and an AI advisor that explains your
own numbers instead of generic textbook examples.

Design direction: an Indian bank passbook — ruled ledger rows,
ink-stamp verification badges, serif headers, monospace figures.

## Features

- **Four live calculators** — compound interest, SIP (with step-up),
  loan/EMI amortization, retirement corpus — all computed server-side,
  updating live as you move a slider
- **Accounts** — email/password and Google OAuth, with automatic
  account linking if both are used on the same email
- **Saved scenarios** — save, reopen, update in place, or save as a
  new copy; compare any two side by side with an overlaid chart
- **AI advisor** — explains a scenario's already-computed numbers in
  plain language; grounded strictly in real data, never does its own math
- **Forgot password** via email
- Dark/light themes, full auth flow, responsive layout, an interactive
  landing page

## Tech stack

- **Frontend:** React + TypeScript (Vite), React Router, Recharts
- **Backend:** Express + TypeScript, MongoDB (Mongoose), Zod validation
- **Auth:** JWT (short-lived access token in memory, long-lived
  refresh token in an httpOnly cookie) + Google OAuth
- **AI:** Google Gemini
- **Email:** Resend

## Project structure

```
vriddhi/
├── frontend/            React + Vite app
├── backend/              Express API
└── ARCHITECTURE.md     Design decisions and tradeoffs
```

## Running locally

### Backend (start first)
```bash
cd backend
npm install
cp .env.example .env
# Fill in: MONGODB_URI, JWT secrets (openssl rand -hex 32),
# GOOGLE_CLIENT_ID, GEMINI_API_KEY, RESEND_API_KEY
npm run dev      # API on http://localhost:4000
npm test         # run the test suite
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Fill in VITE_GOOGLE_CLIENT_ID (same client ID as backend)
npm run dev       # app on http://localhost:5173
```

## Deploying

Backend → **Render**, Frontend → **Vercel** (both have free tiers).

**Backend on Render**
- New Web Service → connect this repo
- Root Directory: `backend`
- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Add all env vars from `backend/.env`, plus `NODE_ENV=production`
  (required for cross-domain cookies to work) and `FRONTEND_ORIGIN`
  set to your Vercel URL

**Frontend on Vercel**
- Add New Project → same repo
- Root Directory: `frontend`
- Env vars: `VITE_API_URL` (your Render URL), `VITE_GOOGLE_CLIENT_ID`

**After both are live**
- Add the Vercel URL to the Google Cloud Console OAuth Client's
  authorized JavaScript origins
- Update `og:url` in `frontend/index.html` to the real domain

## Architecture

See `ARCHITECTURE.md` for the reasoning behind key decisions — why
all math lives server-side in pure functions, the JWT/OAuth session
design, and why the AI advisor is structurally prevented from doing
its own arithmetic.

## License

Personal portfolio project.
