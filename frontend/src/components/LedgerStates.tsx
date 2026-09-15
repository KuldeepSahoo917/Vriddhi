import './LedgerStates.css';

export function LedgerSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="ledger-skeleton" aria-busy="true" aria-label="Loading entries">
      {Array.from({ length: rows }).map((_, i) => (
        <div className="ledger-skeleton__row" key={i}>
          <div className="ledger-skeleton__bar" style={{ width: '20%' }} />
          <div className="ledger-skeleton__bar" style={{ width: '25%' }} />
          <div className="ledger-skeleton__bar" style={{ width: '25%' }} />
          <div className="ledger-skeleton__bar" style={{ width: '20%' }} />
        </div>
      ))}
    </div>
  );
}

export function LedgerEmptyState({
  title = 'No entries yet',
  message = 'Start a plan to see your growth recorded here.',
  actionLabel = 'New scenario',
  onAction,
}: {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="ledger-empty">
      <div className="ledger-empty__mark" aria-hidden="true">+</div>
      <h3 className="ledger-empty__title">{title}</h3>
      <p className="ledger-empty__message">{message}</p>
      {onAction && (
        <button className="ledger-empty__action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function LedgerErrorState({
  message = "This entry couldn't be loaded.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="ledger-error" role="alert">
      <p className="ledger-error__message">{message}</p>
      {onRetry && (
        <button className="ledger-error__retry" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
