import {
  Heart,
  Home,
  Images,
  Menu,
  MessageCircle,
  Search,
  ShoppingBag,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useEffect } from 'react'
import { Brand } from '../ui/Brand'
import { SearchPanel } from './SearchPanel'
import { useAppSelector } from '../../app/hooks'
import { useSession } from '../../hooks/useSession'

const headerActions = [
  { label: 'Wishlist', icon: Heart },
  { label: 'Account', icon: UserRound },
] as const

const navItems = [
  { label: 'Home', href: '#home', icon: Home },
  { label: 'Categories', href: '#honey', icon: ShoppingBag },
  { label: 'Gifting', href: '#trending', icon: Sparkles },
  { label: 'Gallery', href: '#gallery', icon: Images },
  { label: 'Contact', href: '#contact', icon: MessageCircle },
] as const

export function Header() {
  const cartCount = useAppSelector((state) => state.commerce.cart.reduce((total, item) => total + item.quantity, 0))
  const wishlistCount = useAppSelector((state) => state.commerce.wishlist.length)
  const { user } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 24)
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSearchOpen(false)
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setIsSearchOpen(true)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('keydown', handleKey)
    }
  }, [])

  return (
    <header className={`site-header sticky top-0 z-50 border-b border-[#e8e2d8]/80 bg-[#fffdf8]/90 backdrop-blur-xl transition-shadow duration-300 dark:border-stone-800 dark:bg-stone-950/90 ${isScrolled ? 'shadow-[0_10px_35px_rgba(24,50,39,.1)]' : ''}`}>
      <div className={`hidden items-center justify-center overflow-hidden bg-[#173f32] px-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f6e9cd] transition-all sm:flex ${isScrolled ? 'h-0' : 'h-8'}`}>
        Free delivery above ₹999 <span className="mx-3 text-[#d8b36a]">•</span> Freshly packed after you order
      </div>
      <div className="mx-auto flex h-[84px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-14">
        <Brand />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {navItems.map(({ label, href, icon: Icon }) => (
            <a className="nav-icon-link group" href={href} key={label}>
              <Icon size={15} strokeWidth={1.8} /><span>{label}</span>
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-0.5 sm:gap-1">
          <button className="icon-button mobile-only" aria-label="Search" type="button" onClick={() => setIsSearchOpen(true)}><Search size={18} /></button>
          <div className="hidden items-center sm:flex">
            <button className="icon-button group relative" aria-label="Search" type="button" onClick={() => setIsSearchOpen(true)}>
              <Search className="transition group-hover:rotate-[-8deg] group-hover:scale-110" size={18} />
              <span className="absolute -bottom-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-[#173f32] px-2 py-1 text-[9px] text-white group-hover:block">Search ⌘K</span>
            </button>
            {headerActions.map(({ label, icon: Icon }) => (
              <a className="icon-button group relative" aria-label={label === 'Account' && user ? `My account (${user.fullName})` : label} key={label} href={label === 'Wishlist' ? '#wishlist' : '#account'}>
                {label === 'Account' && user ? (
                  <span className="grid size-[26px] place-items-center rounded-full bg-[#173f32] text-[11px] font-bold text-[#f0d59f]">{(user.firstName || user.email)[0].toUpperCase()}</span>
                ) : (
                  <Icon className="transition group-hover:-translate-y-0.5 group-hover:scale-110" size={18} />
                )}
                {label === 'Wishlist' && wishlistCount > 0 && <span className="header-count">{wishlistCount}</span>}
              </a>
            ))}
          </div>
          <a className="icon-button relative" aria-label="Shopping cart" href="#cart">
            <ShoppingBag size={18} />
            {cartCount > 0 && <span className="header-count">{cartCount}</span>}
          </a>
          <button
            className="icon-button mobile-only"
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
            type="button"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {isMenuOpen && (
        <nav className="border-t border-stone-100 bg-white px-5 py-4 shadow-lg dark:border-stone-800 dark:bg-stone-950 md:hidden" aria-label="Mobile navigation">
          {navItems.map(({ label, href, icon: Icon }) => (
            <a
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50 dark:text-stone-200 dark:hover:bg-stone-900"
              href={href}
              key={label}
              onClick={() => setIsMenuOpen(false)}
            >
              <Icon size={17} /> {label}
            </a>
          ))}
          {headerActions.map(({ label, icon: Icon }) => (
            <a
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50 dark:text-stone-200 dark:hover:bg-stone-900 sm:hidden"
              href={label === 'Wishlist' ? '#wishlist' : '#account'}
              key={label}
              onClick={() => setIsMenuOpen(false)}
            >
              <Icon size={17} /> {label === 'Account' && user ? `My account (${user.firstName || user.email})` : label}
            </a>
          ))}
        </nav>
      )}
      {isSearchOpen && <SearchPanel onClose={() => setIsSearchOpen(false)} />}
    </header>
  )
}
