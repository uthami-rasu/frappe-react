import { useEffect, useState } from 'react'
import { Header } from './components/layout/Header'
import { useLenis } from './hooks/useLenis'
import { useTheme } from './hooks/useTheme'
import { useReveal } from './hooks/useReveal'
import { CategoryPage } from './pages/CategoryPage'
import { HomePage } from './pages/HomePage'
import { ProductDetailPage } from './pages/ProductDetailPage'
import { ScrollProgress } from './components/ui/ScrollProgress'
import { useCatalog } from './hooks/useCatalog'
import { CartPage, OrderCompletePage, WishlistPage } from './pages/CommercePages'
import { CheckoutPage } from './pages/CheckoutPage'
import { MyAccountPage } from './pages/MyAccountPage'
import { accountTabs, type AccountTab } from './constants/account'
import { AuthPage } from './pages/AuthPage'
import { useSession } from './hooks/useSession'
import { ContactPage } from './pages/ContactPage'

import { Toaster } from 'sonner'

function App() {
  const [route, setRoute] = useState(() => window.location.hash)
  const { products, isLoading } = useCatalog()
  const { user, isLoading: isSessionLoading } = useSession()
  useLenis()
  useTheme()
  useReveal()

  useEffect(() => {
    const handleRoute = () => {
      setRoute(window.location.hash)
    }
    window.addEventListener('hashchange', handleRoute)
    return () => window.removeEventListener('hashchange', handleRoute)
  }, [])

  useEffect(() => {
    const scrollToTop = () => {
      const lenis = (window as any).lenis
      if (lenis && typeof lenis.scrollTo === 'function') {
        lenis.scrollTo(0, { immediate: true })
      }
      window.scrollTo(0, 0)
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }

    scrollToTop()
    const timer = setTimeout(scrollToTop, 50)
    return () => clearTimeout(timer)
  }, [route])

  // '#account/orders' → ['account', 'orders']; '#login/checkout' → ['login', 'checkout'] (where to go after signing in)
  const [routeBase, routeArg] = route.replace(/^#/, '').split('/')
  const isAuthRoute = routeBase === 'login' || routeBase === 'register'
  const authNext = isAuthRoute && routeArg ? `#${routeArg}` : '#account'
  const accountTab: AccountTab = accountTabs.includes(routeArg as AccountTab) ? (routeArg as AccountTab) : 'account'

  useEffect(() => {
    if (user && isAuthRoute) window.location.hash = authNext
  }, [user, isAuthRoute, authNext])

  const productSlug = route.startsWith('#product/') ? decodeURIComponent(route.slice('#product/'.length)) : null
  const selectedProduct = productSlug ? products.find((product) => product.slug === productSlug) : undefined

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 transition-colors duration-300 dark:bg-stone-950 dark:text-stone-50">
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
      <ScrollProgress route={route} />
      <Header />
      {productSlug && isLoading ? (
        <main className="min-h-screen" aria-busy="true" />
      ) : selectedProduct ? (
        <ProductDetailPage product={selectedProduct} products={products} />
      ) : route === '#cart' ? (
        <CartPage products={products} />
      ) : route === '#checkout' ? (
        <CheckoutPage products={products} />
      ) : route === '#order-complete' ? (
        <OrderCompletePage products={products} />
      ) : route === '#wishlist' ? (
        <WishlistPage products={products} />
      ) : isAuthRoute ? (
        user ? <main className="min-h-screen" aria-busy="true" /> : <AuthPage key={routeBase} initialMode={routeBase === 'register' ? 'register' : 'login'} next={authNext} />
      ) : routeBase === 'account' || routeBase === 'my-account' ? (
        isSessionLoading ? (
          <main className="min-h-screen" aria-busy="true" />
        ) : user ? (
          <MyAccountPage products={products} user={user} tab={accountTab} />
        ) : (
          <AuthPage next={route} />
        )
      ) : route === '#contact' ? (
        <ContactPage />
      ) : route === '#honey' ? (
        <CategoryPage products={products} />
      ) : (
        <HomePage />
      )}
    </div>
  )
}

export default App
