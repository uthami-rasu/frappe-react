import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'

type ActionLinkProps = {
  children: ReactNode
  href: string
  variant?: 'primary' | 'secondary'
  showArrow?: boolean
}

export function ActionLink({
  children,
  href,
  variant = 'primary',
  showArrow = true,
}: ActionLinkProps) {
  const variantClass =
    variant === 'primary'
      ? 'border-white/80 bg-[#d9a66d]/85 text-white shadow-lg shadow-amber-950/10 hover:bg-[#c88f50]'
      : 'border-white bg-white text-stone-800 shadow-md shadow-amber-950/5 hover:bg-stone-50'

  return (
    <a
      href={href}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-full border px-6 text-sm font-semibold transition duration-300 hover:-translate-y-0.5 ${variantClass}`}
    >
      {children}
      {variant === 'primary' && showArrow && <ArrowRight aria-hidden="true" size={15} />}
    </a>
  )
}
