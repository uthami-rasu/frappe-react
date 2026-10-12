import { toast } from 'sonner'
import { Heart, X } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { addToCart, toggleWishlist } from '../../features/commerce/commerceSlice'
import type { CatalogProduct } from '../../types/catalog'
import { formatMoney } from '../../utils/money'

export function AccountWishlist({ products }: { products: CatalogProduct[] }) {
  const dispatch = useAppDispatch()
  const wishlist = useAppSelector((state) => state.commerce.wishlist)
  const wishedProducts = wishlist
    .map((id) => products.find((product) => product.id === id))
    .filter((product): product is CatalogProduct => Boolean(product))

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-[#e2ded5] rounded-xl p-6 md:p-8 shadow-sm">
      <h2 className="text-2xl font-bold text-stone-900 mb-8">Your Wishlist</h2>
      {wishedProducts.length === 0 ? (
        <div className="grid place-items-center gap-3 rounded-xl border border-dashed border-stone-300 py-12 text-center text-sm text-stone-500">
          <Heart className="text-[#D9B27C]" size={26} />
          Tap the heart on any product to save it here.
          <a href="#honey" className="rounded-full bg-[#173f32] px-5 py-2 text-xs font-bold text-white">Browse products</a>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="text-stone-400 border-b border-stone-200 text-xs font-semibold">
                <th className="pb-3 font-normal w-12"></th>
                <th className="pb-3 font-normal">Product</th>
                <th className="pb-3 font-normal">Price</th>
                <th className="pb-3 font-normal text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {wishedProducts.map((product) => (
                <tr key={product.id} className="hover:bg-stone-50/50">
                  <td className="py-4 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        dispatch(toggleWishlist(product.id))
                        toast.info('Removed from wishlist')
                      }}
                      className="text-stone-400 hover:text-stone-700 transition-colors p-1"
                      aria-label={`Remove ${product.name} from wishlist`}
                    >
                      <X size={16} />
                    </button>
                  </td>
                  <td className="py-4 pr-4">
                    <a href={`#product/${product.slug}`} className="flex items-center gap-3">
                      <img src={product.image} alt={product.name} className="w-14 h-14 rounded-lg object-cover border border-stone-200" />
                      <span>
                        <span className="block font-bold text-stone-900 text-sm">{product.name}</span>
                        {product.size && <span className="block text-xs text-stone-400">(Weight: {product.size})</span>}
                      </span>
                    </a>
                  </td>
                  <td className="py-4 font-bold text-stone-900 text-sm">{formatMoney(product.price)}</td>
                  <td className="py-4 text-right">
                    <button
                      type="button"
                      disabled={!product.inStock}
                      onClick={() => {
                        dispatch(addToCart({ productId: product.id, quantity: 1, weight: product.size }))
                        toast.success('Added to cart!', { description: `${product.name} added to your bag.` })
                      }}
                      className="bg-[#D9B27C] hover:bg-[#c9a068] text-white font-bold px-5 py-2 rounded-lg text-xs transition-colors shadow-sm inline-flex items-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {product.inStock ? 'Add to cart' : 'Sold out'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
