import type { ReactNode } from 'react';
import './LedgerRow.css';

export interface LedgerColumn {
  /** Unique key for React list rendering */
  key: string;
  /** Cell content — string for data rows, string for header labels */
  value: ReactNode;
  align?: 'left' | 'right';
  /** Emphasize this cell (e.g. running balance column) */
  emphasize?: boolean;
}

export interface LedgerRowProps {
  columns: LedgerColumn[];
  /** Header rows use a lighter, non-monospace style */
  variant?: 'header' | 'data';
  /** Last row in a table gets a solid bottom rule instead of dashed */
  isLast?: boolean;
  children?: ReactNode; // allows overlaying a StampBadge etc.
}

/**
 * LedgerRow
 * Pure presentational grid row mimicking a passbook ledger line.
 * Caller supplies columns; component only handles layout/rules.
 */
export function LedgerRow({
  columns,
  variant = 'data',
  isLast = false,
  children,
}: LedgerRowProps) {
  return (
    <div
      className={`ledger-row ledger-row--${variant} ${
        isLast ? 'ledger-row--last' : ''
      }`}
      style={{ gridTemplateColumns: `60px repeat(${columns.length - 1}, 1fr)` }}
    >
      {columns.map((col) => (
        <span
          key={col.key}
          className={`ledger-row__cell ${
            col.align === 'right' ? 'ledger-row__cell--right' : ''
          } ${col.emphasize ? 'ledger-row__cell--emphasize' : ''}`}
        >
          {col.value}
        </span>
      ))}
      {children}
    </div>
  );
}
