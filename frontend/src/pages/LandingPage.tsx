import { useState, useEffect, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { StampBadge } from '../components/StampBadge';
import { LedgerRow } from '../components/LedgerRow';
import { LandingPageDecor } from '../components/LandingPageDecor';
import { Reveal } from '../components/Reveal';
import { useCountUp } from '../lib/useCountUp';
import './LandingPage.css';

const CALCULATORS = [
  {
    type: 'compound-interest',
    label: 'Compound interest',
    blurb: 'Watch a lump sum grow, year by year.',
  },
  {
    type: 'sip',
    label: 'SIP',
    blurb: 'Monthly contributions, with optional step-up.',
  },
  {
    type: 'loan',
    label: 'Loan / EMI',
    blurb: 'Full amortization — see every rupee of interest.',
  },
  {
    type: 'retirement',
    label: 'Retirement',
    blurb: 'Project your corpus from today to retirement age.',
  },
] as const;

const PREVIEW_PRINCIPAL = 100000;
const PREVIEW_YEARS = 15;
const PREVIEW_MIN_RATE = 1;
const PREVIEW_MAX_RATE = 20;
const PREVIEW_DEFAULT_RATE = 9;

function HeroPreviewCard() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [rate, setRate] = useState(PREVIEW_DEFAULT_RATE);
  const [userTookControl, setUserTookControl] = useState(false);
  const [introDone, setIntroDone] = useState(false);

  // Same compound-interest formula as the real backend engine — this
  // is a small enough calculation that duplicating it here (rather
  // than calling the API on every drag tick, on the marketing page,
  // before sign-in) is the right tradeoff. Numbers stay honest either way.
  const finalAmountExact = Math.round(
    PREVIEW_PRINCIPAL * Math.pow(1 + rate / 100, PREVIEW_YEARS),
  );

  // Entrance tween (0 -> default amount) plays once on mount. After it
  // finishes, we switch to tracking the live value directly — chasing
  // a continuously moving target with a spring/ease tween would look
  // laggy once the auto-oscillation or a real drag takes over.
  const introAmount = useCountUp(
    Math.round(PREVIEW_PRINCIPAL * Math.pow(1 + PREVIEW_DEFAULT_RATE / 100, PREVIEW_YEARS)),
    1200,
  );
  useEffect(() => {
    const timer = setTimeout(() => setIntroDone(true), 1300);
    return () => clearTimeout(timer);
  }, []);
  const displayedAmount = introDone ? finalAmountExact : introAmount;

  // Auto-oscillate the rate on a slow sine wave until someone actually
  // grabs the slider — a self-playing demo that shows off the live
  // chart/figure link without requiring anyone to discover it by
  // dragging. Hands off permanently once touched, and skips entirely
  // for anyone who prefers reduced motion.
  useEffect(() => {
    if (userTookControl) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame: number;
    const start = performance.now();
    const mid = (PREVIEW_MIN_RATE + PREVIEW_MAX_RATE) / 2;
    const amplitude = (PREVIEW_MAX_RATE - PREVIEW_MIN_RATE) / 2;
    const periodSeconds = 6;

    function tick(now: number) {
      const elapsed = (now - start) / 1000;
      const next = mid + amplitude * Math.sin((elapsed / periodSeconds) * 2 * Math.PI);
      setRate(next);
      frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [userTookControl]);

  const samples = Array.from({ length: 7 }, (_, i) => {
    const yearFrac = (i / 6) * PREVIEW_YEARS;
    return PREVIEW_PRINCIPAL * Math.pow(1 + rate / 100, yearFrac);
  });
  const minAmt = Math.min(...samples);
  const maxAmt = Math.max(...samples);
  const chartPoints = samples
    .map((amt, i) => {
      const x = (i / 6) * 260;
      const y = 66 - ((amt - minAmt) / (maxAmt - minAmt || 1)) * 62;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const fillPercent =
    ((rate - PREVIEW_MIN_RATE) / (PREVIEW_MAX_RATE - PREVIEW_MIN_RATE)) * 100;

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -6, y: px * 8 }); // small, subtle — not a gimmick
  }

  return (
    <div
      className="landing-preview"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      style={{
        transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
      }}
    >
      <div className="landing-preview__row">
        <span className="landing-preview__label">Annual rate</span>
        <span className="landing-preview__value mono">{Math.round(rate)}%</span>
      </div>
      <div className="landing-preview__slider">
        <div className="landing-preview__slider-fill" style={{ width: `${fillPercent}%` }} />
        <div className="landing-preview__slider-handle" style={{ left: `${fillPercent}%` }} />
        <input
          type="range"
          min={PREVIEW_MIN_RATE}
          max={PREVIEW_MAX_RATE}
          value={rate}
          onPointerDown={() => setUserTookControl(true)}
          onChange={(e) => setRate(Number(e.target.value))}
          className="landing-preview__slider-input"
          aria-label="Preview annual rate — drag to see the chart update"
        />
      </div>

      <svg className="landing-preview__chart" viewBox="0 0 260 70" preserveAspectRatio="none">
        <polyline
          className="landing-preview__chart-line"
          points={chartPoints}
          fill="none"
          stroke="var(--text-accent)"
          strokeWidth="2"
          pathLength={1}
        />
      </svg>
      <div className="landing-preview__result">
        <span className="landing-preview__result-label">Final amount</span>
        <span className="landing-preview__result-value mono">
          ₹{displayedAmount.toLocaleString('en-IN')}
        </span>
      </div>
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="landing-page">
      <section className="landing-hero">
        <div className="landing-hero__glow" aria-hidden="true" />
        <LandingPageDecor />
        <div className="landing-container landing-hero__grid">
          <div className="landing-hero__text">
            <svg className="landing-hero__icon" viewBox="0 0 64 64" fill="none" aria-hidden="true">
              <ellipse cx="32" cy="46" rx="22" ry="7" stroke="var(--border-gold)" strokeWidth="2" />
              <ellipse cx="32" cy="38" rx="22" ry="7" stroke="var(--border-gold)" strokeWidth="2" />
              <ellipse cx="32" cy="30" rx="22" ry="7" stroke="var(--border-gold)" strokeWidth="2" />
              <ellipse cx="32" cy="22" rx="22" ry="7" fill="var(--bg-page)" stroke="var(--border-gold)" strokeWidth="2" />
              <text x="32" y="27" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="14" fill="var(--text-gold)">₹</text>
            </svg>
            <h1 className="landing-hero__headline">
              See what your money will actually do
            </h1>
            <p className="landing-hero__subhead">
              Interactive calculators plus an AI advisor that explains your numbers —
              not textbook examples.
            </p>
            <div className="landing-hero__actions">
              <Link to="/calculator" className="landing-hero__cta-primary">
                Try the calculator
              </Link>
              <Link to="/auth" className="landing-hero__cta-secondary">
                Sign up free
              </Link>
            </div>
          </div>

          <HeroPreviewCard />
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-container">
          <h2 className="landing-section__title">How it works</h2>
          <div className="landing-steps">
            <div className="landing-steps__line" aria-hidden="true" />
            <Reveal delayMs={0}>
              <div className="landing-step">
                <StampBadge label="1" status="reached" rotate={-6} size="sm" />
                <p className="landing-step__title">Enter your numbers</p>
                <p className="landing-step__text">Principal, rate, years — or a loan, SIP, or retirement plan.</p>
              </div>
            </Reveal>
            <Reveal delayMs={100}>
              <div className="landing-step">
                <StampBadge label="2" status="reached" rotate={4} size="sm" />
                <p className="landing-step__title">Watch it grow</p>
                <p className="landing-step__text">Drag a slider and the chart and ledger update instantly.</p>
              </div>
            </Reveal>
            <Reveal delayMs={200}>
              <div className="landing-step">
                <StampBadge label="3" status="reached" rotate={-3} size="sm" />
                <p className="landing-step__title">Ask why</p>
                <p className="landing-step__text">The AI advisor explains your specific numbers, grounded in what was actually computed.</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="landing-section landing-section--alt">
        <div className="landing-container">
          <h2 className="landing-section__title">Four ways to plan</h2>
          <div className="landing-calc-grid">
            {CALCULATORS.map((calc, i) => (
              <Reveal key={calc.type} delayMs={i * 80}>
                <Link
                  to="/calculator"
                  state={{ scenarioType: calc.type }}
                  className="landing-calc-card"
                >
                  <StampBadge
                    label={calc.label.slice(0, 6).toUpperCase()}
                    status="reached"
                    rotate={-4}
                    size="sm"
                  />
                  <p className="landing-calc-card__label">{calc.label}</p>
                  <p className="landing-calc-card__blurb">{calc.blurb}</p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-container landing-container--narrow">
          <h2 className="landing-section__title">A passbook that explains itself</h2>
          <div className="landing-ledger-preview">
            <LedgerRow
              variant="header"
              columns={[
                { key: 'y', value: 'Year' },
                { key: 'd', value: 'Deposited', align: 'right' },
                { key: 'i', value: 'Interest', align: 'right' },
                { key: 'b', value: 'Balance', align: 'right' },
              ]}
            />
            <LedgerRow
              columns={[
                { key: 'y', value: '01' },
                { key: 'd', value: '₹1,00,000', align: 'right' },
                { key: 'i', value: '₹9,000', align: 'right' },
                { key: 'b', value: '₹1,09,000', align: 'right', emphasize: true },
              ]}
            />
            <LedgerRow
              isLast
              columns={[
                { key: 'y', value: '15' },
                { key: 'd', value: '₹1,00,000', align: 'right' },
                { key: 'i', value: '₹2,64,248', align: 'right' },
                { key: 'b', value: '₹3,64,248', align: 'right', emphasize: true },
              ]}
            />
          </div>

          <div className="landing-advisor-note">
            <span className="landing-advisor-note__icon" aria-hidden="true">✦</span>
            <div>
              <p className="landing-advisor-note__q">"Why did growth speed up after year 10?"</p>
              <p className="landing-advisor-note__a">
                Compounding accelerates over time — most of your gains happen in
                the later years, once interest starts earning its own interest.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-cta-band">
        <div className="landing-hero__glow landing-hero__glow--cta" aria-hidden="true" />
        <div className="landing-container">
          <h2>Start your growth passbook</h2>
          <p>Free to use. Save your plans once you sign up.</p>
          <Link to="/auth" className="landing-hero__cta-primary">
            Get started
          </Link>
        </div>
      </section>
    </div>
  );
}
