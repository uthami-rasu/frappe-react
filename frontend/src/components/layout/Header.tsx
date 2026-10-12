import {
  BadgePercent,
  Heart,
  Home,
  Images,
  LayoutGrid,
  Menu,
  MessageCircle,
  Search,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  UserRound,
  X,
} from 'lucide-react'
import { memo, useEffect, useState } from 'react'
import { useAppSelector } from '../../app/hooks'
import { useRoute } from '../../app/router'
import { useCatalog } from '../../hooks/useCatalog'
import { useStorefrontConfig } from '../../hooks/useCartQuote'
import { useSession } from '../../hooks/useSession'
import { Brand } from '../ui/Brand'
import { SearchBox } from './SearchBox'
import { SearchPanel } from './SearchPanel'

const navItems = [
  { label: 'Home', href: '#home', icon: Home },
  { label: 'Categories', href: '#honey', icon: ShoppingBag },
  { label: 'Gifting', href: '#trending', icon: Sparkles },
  { label: 'Gallery', href: '#gallery', icon: Images },
  { label: 'Contact', href: '#contact', icon: MessageCircle },
] as const

function CartLink() {
  const cartCount = useAppSelector((state) => state.commerce.cart.reduce((total, item) => total + item.quantity, 0))
  const pulse = useAppSelector((state) => state.ui.cartPulse)
  return (
    <a className="icon-button relative" aria-label={`Shopping cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`} href="#cart">
      <ShoppingBag size={19} />
      {cartCount > 0 && <span key={pulse} className={`sf-cart-badge ${pulse ? 'is-pulsing' : ''}`} aria-hidden="true">{cartCount > 99 ? '99+' : cartCount}</span>}
    </a>
  )
}

const CategoryBar = memo(function CategoryBar() {
  const { categories } = useCatalog()
  const route = useRoute()
  const current = route.path === 'honey' ? route.params.get('category') : null
  const visible = categories.filter((category) => category.depth <= 1)
  return (
    <nav className="sf-catbar" aria-label="Shop by category">
      <div className="sf-catbar-inner mx-auto max-w-[1440px] px-3 sm:px-6 lg:px-12">
        <a href="#honey" aria-current={route.path === 'honey' && !current && !route.params.get('deals') && !route.params.get('sort') ? 'page' : undefined}><LayoutGrid size={14} /> All products</a>
        <a href="#honey?deals=1" aria-current={route.params.get('deals') === '1' ? 'page' : undefined}><BadgePercent size={14} /> Today’s deals</a>
        <a href="#honey?sort=popular" aria-current={route.path === 'honey' && route.params.get('sort') === 'popular' ? 'page' : undefined}><TrendingUp size={14} /> Best sellers</a>
        {visible.map((category) => (
          <a key={category.name} href={`#honey?category=${encodeURIComponent(category.name)}`} aria-current={current === category.name ? 'page' : undefined} className={category.depth ? 'opacity-85' : 'font-bold'}>
            {category.name}
          </a>
        ))}
      </div>
    </nav>
  )
})

export function Header() {
  const wishlistCount = useAppSelector((state) => state.commerce.wishlist.length)
  const { user } = useSession()
  const config = useStorefrontConfig()
  const route = useRoute()
  // the menu belongs to the page it was opened on, so navigating closes it
  const [menuOpenOn, setMenuOpenOn] = useState<string | null>(null)
  const isMenuOpen = menuOpenOn === route.hash
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 24)
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsSearchOpen(false)
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        const inline = document.querySelector<HTMLInputElement>('.site-header .sf-search input')
        if (inline && inline.offsetParent !== null) inline.focus()
        else setIsSearchOpen(true)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('keydown', handleKey)
    }
  }, [])

  const greeting = user ? `Hello, ${user.firstName || user.fullName.split(' ')[0]}` : 'Hello, sign in'
  const searchKey = route.path === 'honey' ? route.params.toString() : 'search'

  return (
    <header className={`site-header sticky top-0 z-50 border-b border-[#e8e2d8]/80 bg-[#fffdf8]/95 backdrop-blur-xl transition-shadow duration-300 dark:border-stone-800 dark:bg-stone-950/95 ${isScrolled ? 'shadow-[0_10px_35px_rgba(24,50,39,.1)]' : ''}`}>
      {config?.announcement && (
        <div className={`hidden items-center justify-center overflow-hidden bg-[#10291f] px-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#f6e9cd] transition-all sm:flex ${isScrolled ? 'h-0' : 'h-8'}`}>
          {config.announcement}
        </div>
      )}
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:h-[78px] lg:gap-6 lg:px-12">
        <Brand />

        <div className="hidden flex-1 justify-center md:flex">
          <SearchBox key={searchKey} initialQuery={route.path === 'honey' ? route.params.get('q') ?? '' : ''} />
        </div>

        <nav className="hidden items-center gap-1 2xl:flex" aria-label="Main navigation">
          {navItems.map(({ label, href, icon: Icon }) => (
            <a className="nav-icon-link group" href={href} key={label}>
              <Icon size={15} strokeWidth={1.8} /><span>{label}</span>
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-0.5 sm:gap-1 md:ml-0">
          {/* wrappers carry the breakpoints: .icon-button's own display rule would override them */}
          <span className="md:hidden"><button className="icon-button" aria-label="Search" type="button" onClick={() => setIsSearchOpen(true)}><Search size={19} /></button></span>
          <a href="#account" className="hidden flex-col rounded-lg px-2 py-1 leading-tight hover:bg-stone-100 lg:flex dark:hover:bg-stone-900" aria-label={user ? `My account (${user.fullName})` : 'Sign in or create an account'}>
            <span className="text-[11px] text-stone-500 dark:text-stone-400">{greeting}</span>
            <span className="text-[13px] font-bold text-[#173f32] dark:text-stone-100">Account &amp; orders</span>
          </a>
          <span className="lg:hidden">
            <a className="icon-button" aria-label={user ? `My account (${user.fullName})` : 'Account'} href="#account">
              {user ? <span className="grid size-[26px] place-items-center rounded-full bg-[#173f32] text-[11px] font-bold text-[#f0d59f]">{(user.firstName || user.email)[0].toUpperCase()}</span> : <UserRound size={19} />}
            </a>
          </span>
          <span className="hidden sm:inline-flex">
            <a className="icon-button relative" aria-label={`Wishlist, ${wishlistCount} saved`} href="#wishlist">
              <Heart size={19} />
              {wishlistCount > 0 && <span className="header-count" aria-hidden="true">{wishlistCount}</span>}
            </a>
          </span>
          <CartLink />
          <span className="2xl:hidden"><button
            className="icon-button"
            aria-label="Menu"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpenOn(isMenuOpen ? null : route.hash)}
            type="button"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button></span>
        </div>
      </div>
      <CategoryBar />
      {isMenuOpen && (
        <nav id="mobile-navigation" className="border-t border-stone-100 bg-white px-5 py-4 shadow-lg dark:border-stone-800 dark:bg-stone-950" aria-label="Site navigation">
          {navItems.map(({ label, href, icon: Icon }) => (
            <a className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50 dark:text-stone-200 dark:hover:bg-stone-900" href={href} key={label}>
              <Icon size={17} /> {label}
            </a>
          ))}
          <a className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50 dark:text-stone-200 dark:hover:bg-stone-900" href="#wishlist">
            <Heart size={17} /> Wishlist{wishlistCount ? ` (${wishlistCount})` : ''}
          </a>
          <a className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50 dark:text-stone-200 dark:hover:bg-stone-900" href="#account">
            <UserRound size={17} /> {user ? `My account (${user.firstName || user.email})` : 'Sign in / Create account'}
          </a>
        </nav>
      )}
      {isSearchOpen && <SearchPanel onClose={() => setIsSearchOpen(false)} />}
    </header>
  )
}
