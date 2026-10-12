import bosscoLogo from '../../assets/images/Bossco_Logo__2__page-0001-removebg-preview.webp'
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from '../ui/SocialIcons'

const socialLinks = [
  { label: 'Instagram', href: 'https://instagram.com', icon: InstagramIcon },
  { label: 'Facebook', href: 'https://facebook.com', icon: FacebookIcon },
  { label: 'WhatsApp', href: 'https://wa.me/918807783007', icon: WhatsAppIcon },
] as const

export function FooterBrand() {
  return (
    <div>
      <a className="footer-logo" href="#home" aria-label="Bossco home">
        <img src={bosscoLogo} alt="Bossco — House of Dry Fruits and Nuts" />
      </a>
      <p className="mt-6 max-w-[250px] font-display text-[15px] italic leading-7 text-[#e2d7c1]">
        “Celebrate every moment with the richness of dry fruits.”
      </p>
      <div className="mt-7 flex gap-2.5">
        {socialLinks.map(({ label, href, icon: Icon }) => (
          <a className="footer-social" href={href} aria-label={label} key={label} target="_blank" rel="noreferrer">
            <Icon />
          </a>
        ))}
      </div>
    </div>
  )
}
