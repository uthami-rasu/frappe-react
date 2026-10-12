import { FileText, Heart, Lock, MapPin, PackageCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import { Brand } from '../ui/Brand'
import heroImage from '../../assets/images/ChatGPT Image Jun 10, 2026, 11_08_40 AM 1.webp'

// What an account actually gives a shopper (all backed by Frappe)
const perks = [
  { icon: PackageCheck, title: 'Track orders', text: 'Follow every order from packing to delivery' },
  { icon: FileText, title: 'Invoices', text: 'Download your invoices any time' },
  { icon: Heart, title: 'Wishlist', text: 'Saved on every device you use' },
  { icon: MapPin, title: 'Faster checkout', text: 'Addresses ready for next time' },
]

type AuthLayoutProps = { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <main className="sf-auth">
      <section className="sf-auth-visual" aria-hidden="true">
        <img src={heroImage} alt="" className="sf-auth-visual-img" decoding="async" />
        <div className="sf-auth-visual-shade" />
        <div className="sf-auth-visual-copy">
          <span className="sf-auth-pill">Your Bossco account</span>
          <h2>Better snacks, <em>naturally.</em></h2>
          <p>Freshly packed nuts, dried fruit and raw honey, with your orders, invoices and favourites in one place.</p>
          <ul className="sf-auth-perks">
            {perks.map(({ icon: Icon, title: perkTitle, text }) => (
              <li key={perkTitle}>
                <span><Icon size={18} /></span>
                <div><b>{perkTitle}</b><small>{text}</small></div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="sf-auth-panel" aria-labelledby="auth-title">
        <div className="sf-auth-form">
          <div className="sf-auth-brand"><Brand /></div>
          <h1 id="auth-title">{title}</h1>
          {subtitle && <p className="sf-auth-subtitle">{subtitle}</p>}
          <div className="mt-7">{children}</div>
          {footer}
          <p className="sf-auth-secure"><Lock size={13} aria-hidden="true" /> Secure, encrypted sign-in. We never share your details.</p>
        </div>
      </section>
    </main>
  )
}
