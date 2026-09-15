import './AuthPageDecor.css';

export function AuthPageDecor() {
  return (
    <div className="auth-decor" aria-hidden="true">
      {/* Top-left: empty ledger card outline */}
      <svg className="auth-decor__shape auth-decor__shape--card" viewBox="0 0 100 70">
        <rect x="2" y="2" width="96" height="66" rx="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>

      {/* Top-right: stamp circle with a small sprout, echoing StampBadge */}
      <svg className="auth-decor__shape auth-decor__shape--stamp" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M50 68 V38 M50 38 L40 48 M50 38 L60 48 M38 55 Q50 55 50 42 Q50 55 62 55"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>

      {/* Bottom-left: ledger ruling lines */}
      <svg className="auth-decor__shape auth-decor__shape--rules" viewBox="0 0 140 60">
        <line x1="0" y1="4" x2="140" y2="4" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 5" />
        <line x1="0" y1="30" x2="140" y2="30" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 5" />
        <line x1="0" y1="56" x2="140" y2="56" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 5" />
      </svg>

      {/* Bottom-right: outlined rupee mark */}
      <svg className="auth-decor__shape auth-decor__shape--rupee" viewBox="0 0 80 100">
        <text x="50%" y="78" textAnchor="middle" fontSize="90" fontFamily="var(--font-display)" fill="none" stroke="currentColor" strokeWidth="1.2">
          ₹
        </text>
      </svg>
    </div>
  );
}
