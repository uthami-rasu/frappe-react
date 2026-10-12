import { AlertTriangle, RotateCcw } from 'lucide-react'
import type { ReactNode } from 'react'

export function Skeleton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return <span className={`sf-skeleton ${className}`} style={style} aria-hidden="true" />
}

export function ProductTileSkeleton() {
  return (
    <div className="sf-tile" aria-hidden="true">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="sf-tile-body">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="mt-2 h-6 w-1/2" />
        <Skeleton className="mt-2 h-10 w-full rounded-full" />
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 8, label = 'Loading products' }: { count?: number; label?: string }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sf-sr-only">{label}…</span>
      <div className="sf-grid sf-grid-4">{Array.from({ length: count }, (_, index) => <ProductTileSkeleton key={index} />)}</div>
    </div>
  )
}

export function PageSkeleton() {
  return (
    <main className="sf-page" aria-busy="true">
      <div className="sf-container py-10" role="status">
        <span className="sf-sr-only">Loading…</span>
        <Skeleton className="h-4 w-48" />
        <Skeleton className="mt-6 h-10 w-2/3 max-w-xl" />
        <div className="mt-10"><ProductGridSkeleton count={4} /></div>
      </div>
    </main>
  )
}

type EmptyStateProps = { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode; headingLevel?: 2 | 3 }

export function EmptyState({ icon, title, children, action, headingLevel = 2 }: EmptyStateProps) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3'
  return (
    <div className="sf-empty">
      {icon && <span className="sf-empty-icon" aria-hidden="true">{icon}</span>}
      <Heading>{title}</Heading>
      {children && <p>{children}</p>}
      {action}
    </div>
  )
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }: { title?: string; message?: string; onRetry?: () => void }) {
  return (
    <EmptyState
      icon={<AlertTriangle size={24} />}
      title={title}
      action={onRetry && <button type="button" className="sf-btn sf-btn-outline sf-btn-sm" onClick={onRetry}><RotateCcw size={14} /> Try again</button>}
    >
      {message ?? 'We couldn’t load this right now. Check your connection and try again.'}
    </EmptyState>
  )
}
