import { footerGroups } from '../../constants/footerLinks'
import { FooterBrand } from './FooterBrand'
import { FooterContact } from './FooterContact'
import { FooterLinks } from './FooterLinks'

export function Footer() {
  return (
    <footer className="site-footer px-5 pb-8 pt-16 sm:px-8 lg:pt-20" id="contact">
      <div className="footer-grain" aria-hidden="true" />
      <div className="relative mx-auto max-w-[1440px]">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.15fr_1fr_1fr_1fr_1.2fr] lg:gap-10">
          <FooterBrand />
          {footerGroups.map((group) => (
            <FooterLinks key={group.title} {...group} />
          ))}
          <FooterContact />
        </div>

        <div className="footer-baseline mt-14 flex flex-col gap-4 pt-7 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[#9d947f]">© 2026 Bossco Dry Fruits &amp; Nuts. All Rights Reserved.</p>
          <p className="flex items-center gap-2.5 font-display text-sm italic text-[#e9c187]">
            Healthy Choices <span className="footer-dot" /> Premium Quality <span className="footer-dot" /> Trusted Freshness
          </p>
        </div>
      </div>
    </footer>
  )
}
