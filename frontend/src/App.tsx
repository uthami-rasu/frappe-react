import { lazy, Suspense, useEffect, useRef } from 'react'
import { Toaster } from 'sonner'
import { getLenis } from './app/lenis'
import { loadCommercePages, loadProductPage } from './app/routeChunks'
import { useRoute } from './app/router'
import { CartDrawer } from './components/cart/CartDrawer'
import { Header } from './components/layout/Header'
import { OfferPopup } from './components/offers/OfferPopup'
import { PageSkeleton } from './components/ui/Feedback'
import { ScrollProgress } from './components/ui/ScrollProgress'
import { accountTabs, type AccountTab } from './constants/account'
import { useCatalog } from './hooks/useCatalog'
import { useLenis } from './hooks/useLenis'
import { useReveal } from './hooks/useReveal'
import { useSession } from './hooks/useSession'
import { useTheme } from './hooks/useTheme'
import { CategoryPage } from './pages/CategoryPage'
import { HomePage } from './pages/HomePage'

// Landing pages (home, catalog) are in the main bundle; everything else loads on demand
const ProductDetailPage = lazy(() => loadProductPage().then((module) => ({ default: module.ProductDetailPage })))
const ProductNotFound = lazy(() => loadProductPage().then((module) => ({ default: module.ProductNotFound })))
const CartPage = lazy(() => loadCommercePages().then((module) => ({ default: module.CartPage })))
const OrderCompletePage = lazy(() => loadCommercePages().then((module) => ({ default: module.OrderCompletePage })))
const WishlistPage = lazy(() => loadCommercePages().then((module) => ({ default: module.WishlistPage })))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then((module) => ({ default: module.CheckoutPage })))
const MyAccountPage = lazy(() => import('./pages/MyAccountPage').then((module) => ({ default: module.MyAccountPage })))
const AuthPage = lazy(() => import('./pages/AuthPage').then((module) => ({ default: module.AuthPage })))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then((module) => ({ default: module.ResetPasswordPage })))
const ContactPage = lazy(() => import('./pages/ContactPage').then((module) => ({ default: module.ContactPage })))

const CATALOG_PATHS = new Set(['honey', 'shop', 'search'])
const PAGE_PATHS = new Set([
  '', 'home', 'product', 'cart', 'checkout', 'order-complete', 'wishlist', 'login', 'register', 'reset-password', 'account', 'my-account', 'contact', ...CATALOG_PATHS,
])
const NO_POPUP_PATHS = new Set(['checkout', 'order-complete', 'login', 'register', 'reset-password', 'account', 'my-account'])

function scrollToTarget(target: number | HTMLElement) {
  const lenis = getLenis()
  if (lenis) {
    lenis.scrollTo(target, { immediate: true, offset: typeof target === 'number' ? 0 : -140 })
    return
  }
  if (typeof target === 'number') window.scrollTo(0, target)
  else target.scrollIntoView()
}

function App() {
  const route = useRoute()
  const { products, isLoading } = useCatalog()
  const { user, isLoading: isSessionLoading } = useSession()
  useLenis()
  useTheme()
  useReveal()

  const { path, segments, params } = route
  const productSlug = path === 'product' ? segments[1] ?? '' : null
  // a new page (or product) starts at the top; filter/sort changes (query string only) keep the position
  const pageKey = productSlug !== null ? `product/${productSlug}` : path
  const previousPage = useRef<string | null>(null)
  useEffect(() => {
    const isFirst = previousPage.current === null
    if (previousPage.current === pageKey) return
    previousPage.current = pageKey
    // '#favorites', '#trending', … are sections of the home page
    const section = !PAGE_PATHS.has(path) ? document.getElementById(path) : null
    if (section) {
      window.requestAnimationFrame(() => scrollToTarget(section))
    } else if (!isFirst) {
      scrollToTarget(0)
    }
  }, [pageKey, path])

  const isAuthRoute = path === 'login' || path === 'register'
  const authNext = isAuthRoute && segments[1] ? `#${segments.slice(1).map(encodeURIComponent).join('/')}` : '#account'
  const accountTab: AccountTab = accountTabs.includes(segments[1] as AccountTab) ? (segments[1] as AccountTab) : 'account'

  useEffect(() => {
    if (user && isAuthRoute) window.location.hash = authNext
  }, [user, isAuthRoute, authNext])

  const selectedProduct = productSlug ? products.find((product) => product.slug === productSlug) : undefined

  let page
  if (productSlug !== null) {
    page = isLoading ? <PageSkeleton /> : selectedProduct ? <ProductDetailPage key={selectedProduct.id} product={selectedProduct} products={products} /> : <ProductNotFound />
  } else if (path === 'cart') page = <CartPage products={products} />
  else if (path === 'checkout') page = <CheckoutPage products={products} />
  else if (path === 'order-complete') page = <OrderCompletePage products={products} />
  else if (path === 'wishlist') page = <WishlistPage products={products} />
  else if (isAuthRoute) page = user ? <PageSkeleton /> : <AuthPage key={path} initialMode={path === 'register' ? 'register' : 'login'} next={authNext} />
  else if (path === 'reset-password') page = <ResetPasswordPage resetKey={params.get('key') ?? ''} />
  else if (path === 'account' || path === 'my-account') {
    page = isSessionLoading ? <PageSkeleton /> : user ? <MyAccountPage products={products} user={user} tab={accountTab} /> : <AuthPage next={route.hash || '#account'} />
  } else if (path === 'contact') page = <ContactPage />
  else if (CATALOG_PATHS.has(path)) page = <CategoryPage />
  else page = <HomePage />

  return (
    <div className="min-h-screen overflow-x-clip bg-stone-50 text-stone-900 transition-colors duration-300 dark:bg-stone-950 dark:text-stone-50">
      <a href="#main-content" className="sf-skip-link" onClick={(event) => { event.preventDefault(); document.getElementById('main-content')?.focus() }}>Skip to content</a>
      <Toaster
        position="bottom-right"
        richColors
        closeButton
        expand={false}
        gap={12}
        toastOptions={{
          duration: 3500,
          classNames: {
            toast: 'sonner-toast-luxury',
            title: 'sonner-title',
            description: 'sonner-description',
            closeButton: 'sonner-close',
          },
          style: {
            borderRadius: '16px',
            fontFamily: 'var(--font-sans)',
            fontSize: '13px',
            padding: '14px 16px',
            border: '1px solid rgba(0,0,0,0.07)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
            background: 'rgba(255,255,255,0.96)',
            backdropFilter: 'blur(16px)',
            minWidth: '300px',
          },
        }}
      />
      <ScrollProgress route={pageKey} />
      <Header />
      <div id="main-content" tabIndex={-1} className="outline-none">
        <Suspense fallback={<PageSkeleton />}>{page}</Suspense>
      </div>
      <CartDrawer />
      <OfferPopup suppressed={NO_POPUP_PATHS.has(path)} />
    </div>
  )
}

export default App
