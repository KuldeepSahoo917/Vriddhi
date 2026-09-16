import { LedgerRow } from '../components/LedgerRow';
import { StampBadge } from '../components/StampBadge';
import {
  LedgerSkeleton,
  LedgerEmptyState,
  LedgerErrorState,
} from '../components/LedgerStates';

/**
 * Phase 0 sanity check — renders every shell component once
 * so we can visually confirm tokens + components wire up
 * correctly before Phase 1 builds real features on top.
 */
export function ComponentPreview() {
  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: 'var(--space-6)' }}>
      <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>
        Vriddhi
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
        every rupee, accounted for — component shell preview
      </p>

      <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-3)' }}>
        Ledger rows
      </h2>
      <div style={{ marginBottom: 'var(--space-6)' }}>
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
            { key: 'd', value: '₹60,000', align: 'right' },
            { key: 'i', value: '₹3,900', align: 'right' },
            { key: 'b', value: '₹63,900', align: 'right', emphasize: true },
          ]}
        />
        <LedgerRow
          isLast
          columns={[
            { key: 'y', value: '10' },
            { key: 'd', value: '₹6,00,000', align: 'right' },
            { key: 'i', value: '₹2,41,600', align: 'right' },
            { key: 'b', value: '₹9,55,000', align: 'right', emphasize: true },
          ]}
        >
          <div style={{ position: 'absolute', right: -4, top: -14 }}>
            <StampBadge label="10 YRS" status="reached" rotate={10} />
          </div>
        </LedgerRow>
      </div>

      <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-3)' }}>
        Stamp badges
      </h2>
      <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <StampBadge label="5 YRS" sublabel="₹3.9L" status="reached" rotate={-8} />
        <StampBadge label="10 YRS" sublabel="₹9.5L" status="reached" rotate={6} />
        <StampBadge label="15 YRS" sublabel="locked" status="locked" rotate={0} />
      </div>

      <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-3)' }}>
        States
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <LedgerSkeleton rows={3} />
        <LedgerEmptyState onAction={() => alert('New scenario clicked')} />
        <LedgerErrorState onRetry={() => alert('Retry clicked')} />
      </div>
    </div>
  );
}
