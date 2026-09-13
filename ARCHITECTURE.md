# Vriddhi — Architecture

This document explains *why* Vriddhi is built the way it is, not just
what it does. Written for interview prep as much as for future-me.

---

## 1. Overview

Vriddhi is a financial planning tool: four calculators (compound
interest, SIP, loan/EMI, retirement), user accounts with saved
scenarios, scenario comparison, and an AI advisor that explains a
scenario's numbers in plain language.

**Stack:** React + TypeScript (Vite) frontend, Express + TypeScript
backend, MongoDB, JWT auth with Google OAuth, Google Gemini for the AI
advisor.

**Design direction:** an Indian bank passbook — ruled ledger rows,
ink-stamp verification badges, serif headers + monospace figures. Every
color, spacing, and type value lives in `frontend/src/styles/tokens.css`;
no component hardcodes a color.

---

## 2. The core architectural decision: math lives in one place

Every calculation (compound interest, SIP, loan amortization,
retirement corpus) is a **pure function** in
`backend/src/services/calculations.ts`. Same input, same output,
every time. No I/O, no side effects.

This one decision shapes almost everything else:

- **The frontend never computes.** Sliders debounce, call the API,
  render whatever comes back. If a formula is ever wrong, there's
  exactly one place to fix it.
- **Saved scenarios store the computed result, not just the input.**
  If the calculation engine's formulas change later, old saved
  scenarios don't silently recalculate to different numbers — they
  keep showing what was true when they were saved. Reopening a saved
  scenario re-runs the *current* engine on the *original* input, which
  is a deliberate choice: it means the reopened scenario stays
  consistent with "one source of truth for math" rather than replaying
  a frozen snapshot forever.
- **The AI advisor is not allowed to do math.** This is the biggest
  payoff of the pure-function design — see §5.

All four formulas have unit tests in `backend/src/tests/calculations.test.ts`
(known values, monotonic growth, edge cases like 0% interest, step-up
SIP vs. flat SIP). Cheapest tests in the codebase to write, since
they're pure functions with no mocking required.

---

## 3. Auth architecture

**JWT, two tokens, two lifetimes:**
- **Access token** — short-lived (15 min), kept in memory only
  (`AuthContext`, a module-level variable), *never* localStorage.
- **Refresh token** — long-lived (30 days), stored in an `httpOnly`
  cookie scoped to `/api/auth`, invisible to JavaScript entirely.

On page load, the frontend silently calls `/api/auth/refresh` using
the cookie to get a new access token — this is how a session survives
a page refresh without ever putting the access token somewhere
JavaScript (and therefore XSS) could read it.

**Google OAuth** layers on top of the same session system rather than
replacing it: Google Identity Services gets an ID token client-side,
the backend verifies it server-side with `google-auth-library`, then
issues Vriddhi's own access/refresh tokens exactly like email/password
does. Google is just another way to prove identity — the rest of the
app doesn't know or care how someone signed in.

**Account linking:** if an email/password account signs in with
Google using the same email, the backend links the accounts (adds a
`googleId` to the existing user) instead of creating a duplicate. The
first version of this did it silently; a later pass added a
`linked: true` flag threaded through to a visible confirmation banner,
since silently merging accounts is the kind of thing a user should be
told about.

**Password reset tokens** follow the same principle as passwords:
only a hash is ever stored (`sha256`, not `bcrypt` — reset tokens are
already high-entropy random bytes, so the slow hashing bcrypt does for
low-entropy human passwords isn't needed here). The raw token exists
only in the emailed link.

---

## 4. Data model

**User:** email, `passwordHash` (optional — Google-only accounts have
none), `googleId` (optional, sparse unique index), password reset
token hash + expiry.

**Scenario:** `userId`, `type`, `label`, `input`, `result` — where
`input`/`result` are stored as-is from the calculation engine's
actual API response, not re-derived. Every scenario query is scoped to
`req.userId` from the verified JWT, never trusted from the request
body — a user can only ever see or modify their own scenarios.

---

## 5. AI advisor: grounded, not generative-math

The advisor's system prompt explicitly forbids it from recomputing,
re-deriving, or "sanity checking" any number. It's handed the exact
`input` and `result` from the calculation engine as context and
instructed to only explain what's already there. If asked a "what if"
question, it's told to point the user back to the sliders rather than
estimate a new figure — a live recalculation is always more trustworthy
than an LLM's mental arithmetic.

```
STRICT RULES:
1. Treat given numbers as ground truth. Do not recompute.
2. For "what if" questions, point to the sliders — don't estimate.
3. Never invent numbers not present in the provided data.
```

This is the direct payoff of §2: because the calculation engine's
output has a stable, well-typed shape, it can be dropped straight into
a prompt as trustworthy context.

**Provider story worth knowing for interviews:** this started on
Anthropic's API, which requires billing even for light use. Since this
is a portfolio project where demo traffic shouldn't cost real money,
it was switched to Google Gemini's free tier. That surfaced a second,
more interesting problem: Gemini's model lineup churns fast — three
different model names (`gemini-2.0-flash`, `gemini-1.5-flash`,
`gemini-2.5-flash-lite`) were each deprecated, shut down, or restricted
to pre-existing accounts within the same testing session, each
producing a different error (429 quota=0, 404 not found, 404
restricted-to-existing-users). Landed on `gemini-3.1-flash-lite`, and
the model name is now an env var (`GEMINI_MODEL`) specifically so a
future deprecation doesn't require a code change — just a config
update.

**Cost control:** the endpoint is auth-gated (signed-in only) and
rate-limited separately from the general API limit (20 requests/15min)
since it's the one endpoint with a real per-call cost.

---

## 6. Frontend architecture

**Shared hooks over copy-paste.** All four calculators need the same
pattern: debounce slider input → call an API → track loading/error
state → cancel stale requests if input changes again mid-flight. That
logic lives once in `lib/useLiveCalculation.ts` rather than four times
— a bug fix or behavior change there applies to every calculator
simultaneously.

**Shared components over four separate implementations.**
`SaveScenarioBar` and `AdvisorPanel` are each used by all four
calculators. `GrowthChart` takes a `dataKey` prop so the same
component charts a *growing* balance (SIP, compound interest,
retirement) and a *declining* one (loan remaining balance) without
duplicating chart code.

**Design tokens, not hardcoded styles.** Every component reads colors,
spacing, and type from `tokens.css`. This mattered concretely twice:
once when the logo arrived and the whole palette needed to shift from
a guessed ink-blue/maroon pair to the logo's actual navy/gold — a
one-file change instead of hunting through every component; and again
during the accessibility pass, when `--text-muted`'s contrast ratio
needed correcting everywhere it was used, from one place.

**Routing:** `/` is a marketing landing page, `/calculator` is the
actual tool, `/dashboard` and `/compare` require auth. Reopening a
saved scenario passes it through React Router's navigation `state`
(not query params) — the same mechanism a landing page calculator-type
card uses to pre-select a tab.

---

## 7. Real bugs found during development (and why they're worth mentioning)

A few things shipped broken and were caught later — documenting them
because "I found and fixed X" is a better interview story than
pretending everything was correct on the first pass.

- **`.env` silently not loading.** The backend never had a `dotenv`
  import at all, so `process.env.MONGODB_URI` was `undefined` even
  with a correct `.env` file present. Node doesn't auto-load `.env`
  files; that has to be explicit.
- **A promised feature that was never built.** A Phase 0 code comment
  said ledger rows would show mobile labels "via data-label" — that
  mechanism didn't exist. On a phone, a 4-column ledger table
  collapsed into an unlabeled 2-column grid, showing raw numbers with
  no indication of what they meant. Found during a later mobile audit,
  fixed with horizontal scroll instead (keeps headers and alignment
  intact rather than trying to relabel every cell).
- **Contrast and label-association bugs**, found by actually computing
  WCAG ratios and reading the DOM structure rather than eyeballing —
  `text-muted` failed AA contrast in both themes, and every form label
  in the app was visually adjacent to its input but not programmatically
  connected (`htmlFor`/`id`), which breaks screen readers even though
  it looks completely normal visually.
- **A hardcoded model name that didn't exist** (`claude-sonnet-4-6`),
  caught immediately by a live 502 — a reminder that "the code compiles"
  and "the code works" are different claims for anything calling an
  external API.

---

## 8. Known limitations (deliberately out of scope so far)

- **No automated frontend tests.** Backend has 17 unit tests
  (calculation engine + JWT sign/verify); frontend has none yet.
- **Not deployed.** Runs locally only — no Render/Vercel, no CI.
- **No Docker setup**, despite that being an early goal (Coboard has
  one; Vriddhi doesn't yet).
- **Several backend flows are untested live** in the sense that they
  were built and type-checked but never exercised against a real
  database in this environment (auth, scenarios, forgot-password) —
  they need a real run-through with actual MongoDB/Resend/Gemini
  credentials before being fully trusted.
