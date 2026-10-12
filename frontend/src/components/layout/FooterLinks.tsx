type FooterLinksProps = {
  title: string
  links: readonly string[]
}

export function FooterLinks({ title, links }: FooterLinksProps) {
  return (
    <nav aria-label={title}>
      <h2 className="footer-heading">{title}</h2>
      <ul className="mt-6 space-y-3.5">
        {links.map((link) => (
          <li key={link}>
            <a className="footer-link" href={link === 'Home' ? '#home' : '#favorites'}>
              {link}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
