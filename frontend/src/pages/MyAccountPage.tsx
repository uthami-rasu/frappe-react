import { toast } from 'sonner'
import { NutDecorations } from '../components/home/NutDecorations'
import { AccountDetails } from '../components/account/AccountDetails'
import { AccountWishlist } from '../components/account/AccountWishlist'
import { AddressBook } from '../components/account/AddressBook'
import { OrderHistory } from '../components/account/OrderHistory'
import { useLogoutMutation } from '../features/api/storeApi'
import type { SessionUser } from '../types/account'
import type { CatalogProduct } from '../types/catalog'
import { accountTabs, type AccountTab } from '../constants/account'

const tabLabels: Record<AccountTab, string> = { account: 'Account', address: 'Address', orders: 'Orders', wishlist: 'Wishlist' }

type MyAccountProps = {
  products: CatalogProduct[]
  user: SessionUser
  tab: AccountTab
}

export function MyAccountPage({ products, user, tab }: MyAccountProps) {
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation()
  const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() || user.email[0].toUpperCase()

  const handleLogout = async () => {
    try {
      await logout().unwrap()
      toast.info('You have been logged out')
      window.location.hash = '#home'
    } catch {
      toast.error('Could not log out. Please try again.')
    }
  }

  return (
    <main className="commerce-page account-page relative overflow-hidden">
      <NutDecorations />
      <div className="commerce-wrap relative z-10">
        <h1 className="text-center font-display text-4xl md:text-5xl font-bold text-[#173f32] mb-12">My Account</h1>

        <div className="account-layout grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10 items-start">
          <aside className="account-sidebar bg-[#FBF8F5] border border-[#efeae1] rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
            <span className="mb-4 grid size-24 place-items-center rounded-full border-2 border-white bg-[#173f32] font-display text-3xl font-bold text-[#f0d59f] shadow-md" aria-hidden="true">
              {initials}
            </span>
            <h2 className="text-xl font-bold text-stone-900">{user.fullName}</h2>
            <p className="mb-6 text-xs text-stone-500">{user.email}</p>

            <nav className="w-full flex flex-col gap-1 text-left" aria-label="Account sections">
              {accountTabs.map((item) => (
                <a key={item} href={`#account/${item}`} className={`account-nav-item ${tab === item ? 'is-active' : ''}`} aria-current={tab === item ? 'page' : undefined}>
                  <span>{tabLabels[item]}</span>
                </a>
              ))}
              {user.isSystemUser && (
                <a href="/app" className="account-nav-item">
                  <span>Open ERPNext Desk</span>
                </a>
              )}
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="account-nav-item text-stone-600 hover:text-red-600 mt-2 border-t border-stone-200/60 pt-3"
              >
                <span>{isLoggingOut ? 'Logging out…' : 'Log Out'}</span>
              </button>
            </nav>
          </aside>

          <section className="account-content min-w-0">
            {tab === 'account' && <AccountDetails user={user} />}
            {tab === 'address' && <AddressBook fullName={user.fullName} />}
            {tab === 'orders' && <OrderHistory products={products} />}
            {tab === 'wishlist' && <AccountWishlist products={products} />}
          </section>
        </div>
      </div>
      <div className="commerce-bottom-bar" />
    </main>
  )
}
