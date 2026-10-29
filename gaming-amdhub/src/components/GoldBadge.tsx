import type { ReactNode } from 'react';
import { useShimmerOnce } from '../hooks/useShimmerOnce';

export function GoldBadge({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useShimmerOnce<HTMLSpanElement>();
  return (
    <span ref={ref} className={`badge-gold ${className}`}>
      {children}
    </span>
  );
}
