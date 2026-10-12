import { Mail, MapPin, Phone } from 'lucide-react'

export function FooterContact() {
  return (
    <address className="not-italic">
      <h2 className="footer-heading">Contact Us</h2>
      <ul className="mt-6 space-y-4 text-sm">
        <li className="flex items-start gap-3">
          <span className="footer-contact-chip"><MapPin size={15} strokeWidth={1.9} /></span>
          <span className="pt-1.5 leading-6 text-[#c8bfad]">
            5D/12B Pasuvanthanal Road<br />Kovilpatti, Kovilpatti Mpty,<br />Thoothukudi, Tamilnadu – 628501
          </span>
        </li>
        <li>
          <a className="footer-contact-link" href="tel:+918807783007">
            <span className="footer-contact-chip"><Phone size={15} strokeWidth={1.9} /></span>
            +91 88077 83007
          </a>
        </li>
        <li>
          <a className="footer-contact-link" href="mailto:hello@bossco.com">
            <span className="footer-contact-chip"><Mail size={15} strokeWidth={1.9} /></span>
            hello@bossco.com
          </a>
        </li>
      </ul>
    </address>
  )
}
