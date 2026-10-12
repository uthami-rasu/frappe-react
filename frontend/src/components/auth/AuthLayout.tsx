import { Heart, PackageCheck, ShieldCheck, Truck } from 'lucide-react'
import type { ReactNode } from 'react'
import { Brand } from '../ui/Brand'

const perks = [
  { icon: PackageCheck, text: 'Track every order and download invoices' },
  { icon: Heart, text: 'Keep a wishlist on every device' },
  { icon: Truck, text: 'Save addresses for faster checkout' },
  { icon: ShieldCheck, text: 'Protected by secure, encrypted sign-in' },
]

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <main className="sf-page">
      <div className="sf-container grid min-h-[calc(100vh-180px)] items-center gap-10 py-10 lg:grid-cols-[1fr_480px] lg:py-16">
        <section className="hidden max-w-lg lg:block" aria-hidden="true">
          <Brand />
          <h2 className="mt-8 font-display text-5xl font-bold leading-[1] tracking-[-.02em] text-[#173f32]">Better snacks, <em className="text-[#b77838]">naturally.</em></h2>
          <ul className="mt-8 grid gap-4">
            {perks.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-[15px] text-[var(--sf-ink-soft)]">
                <span className="grid size-10 place-items-center rounded-full bg-[#173f32] text-[#f0d59f]"><Icon size={18} /></span>
                {text}
              </li>
            ))}
          </ul>
        </section>
        <section className="sf-card w-full p-6 shadow-[var(--sf-shadow)] sm:p-9" aria-labelledby="auth-title">
          <h1 id="auth-title" className="font-display text-[2.2rem] font-bold leading-tight">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-[var(--sf-ink-soft)]">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </section>
      </div>
    </main>
  )
}
