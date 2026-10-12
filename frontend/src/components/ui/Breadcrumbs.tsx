import { ChevronRight } from 'lucide-react'

export type Crumb = { label: string; href?: string }

export function Breadcrumbs({ items, className = '' }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="sf-breadcrumbs">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} className="inline-flex items-center gap-2">
              {isLast || !item.href ? <span aria-current={isLast ? 'page' : undefined}>{item.label}</span> : <a href={item.href}>{item.label}</a>}
              {!isLast && <ChevronRight size={13} aria-hidden="true" />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
