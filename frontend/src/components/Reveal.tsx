import type { ReactNode } from 'react';
import { useInView } from '../lib/useInView';
import './Reveal.css';

export function Reveal({
  children,
  delayMs = 0,
  className = '',
}: {
  children: ReactNode;
  delayMs?: number;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`reveal ${inView ? 'reveal--visible' : ''} ${className}`}
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      {children}
    </div>
  );
}
