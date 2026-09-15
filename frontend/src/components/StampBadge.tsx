import './StampBadge.css';

export type StampBadgeStatus = 'reached' | 'locked';

export interface StampBadgeProps {
  /** Short label, e.g. "10 YRS" */
  label: string;
  /** Secondary line, e.g. "₹9.5L" or "locked" */
  sublabel?: string;
  status: StampBadgeStatus;
  /** Slight rotation for hand-stamped feel. Defaults to a small deterministic tilt. */
  rotate?: number;
  size?: 'sm' | 'md';
}

/**
 * StampBadge
 * Pure presentational component — the ink-verification-stamp motif
 * used for milestones, growth multipliers, and AI note tags.
 * No business logic: caller decides label/sublabel/status.
 */
export function StampBadge({
  label,
  sublabel,
  status,
  rotate = -8,
  size = 'md',
}: StampBadgeProps) {
  return (
    <div
      className={`stamp-badge stamp-badge--${status} stamp-badge--${size}`}
      style={{ transform: `rotate(${rotate}deg)` }}
      role="img"
      aria-label={`${label}${sublabel ? `, ${sublabel}` : ''}${
        status === 'locked' ? ', not yet reached' : ', reached'
      }`}
    >
      <span className="stamp-badge__label">{label}</span>
      {sublabel && <span className="stamp-badge__sublabel">{sublabel}</span>}
    </div>
  );
}
