import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { Address, AddressInput, Order, Session } from '../../types/account'
import type {
  CartQuote, CatalogProduct, CategoryNode, CheckoutAddress, CheckoutContact, PaymentDetails, PlacedOrder, ProductDetails, ProductQuery,
  ProductQueryResult, RelatedProducts, ReviewPage, ReviewSort, ShippingMethod, StoreOffer, StorefrontConfig,
} from '../../types/catalog'

declare global {
  interface Window { csrf_token?: string }
}

export type PlaceOrderRequest = {
  items: Array<{ item_code: string; qty: number }>
  contact?: CheckoutContact
  address?: CheckoutAddress
  address_name?: string
  shipping_method: ShippingMethod
  payment: PaymentDetails
  coupon_code?: string
  // one per checkout attempt: retrying with the same key returns the order instead of placing another
  checkout_key: string
}

export type CartItemRow = { item_code: string; qty: number }

export type SignUpRequest = { first_name: string; last_name: string; email: string; phone: string; password: string }

// Frappe renders the first token into shop.html (it stays the raw Jinja placeholder under `yarn dev`);
// login, sign up and logout start a new session with a new token, which the session endpoints return.
let csrfToken = window.csrf_token && !window.csrf_token.startsWith('{{') ? window.csrf_token : undefined

const keepCsrfToken = async (_: unknown, { queryFulfilled }: { queryFulfilled: Promise<{ data: Session }> }) => {
  try {
    const { data } = await queryFulfilled
    csrfToken = data.csrf_token ?? undefined
  } catch {
    // the request failed; keep the current token
  }
}

// Frappe reports frappe.throw() as a JSON list of JSON-encoded messages, and failed logins as `message`.
export function getFrappeErrorMessage(data: unknown) {
  const body = data as { _server_messages?: string; message?: unknown } | undefined
  if (body?._server_messages) {
    try {
      const [first] = JSON.parse(body._server_messages) as string[]
      const { message } = JSON.parse(first) as { message: string }
      return message.replace(/<[^>]+>/g, '')
    } catch {
      // fall through to the generic message
    }
  }
  if (typeof body?.message === 'string') return body.message
  return 'Something went wrong. Please try again.'
}

const errorMessage = (error: { data?: unknown; status?: unknown }) =>
  error.status === 'FETCH_ERROR' ? 'You seem to be offline. Check your connection and try again.' : getFrappeErrorMessage(error.data)

const unwrap = <T,>(response: { message: T }) => response.message

const post = <T extends object>(url: string) => (body: T) => ({ url, method: 'POST', body })

export const storeApi = createApi({
  reducerPath: 'storeApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/method/',
    credentials: 'same-origin',
    prepareHeaders: (headers) => {
      headers.set('Accept', 'application/json')
      if (csrfToken) headers.set('X-Frappe-CSRF-Token', csrfToken)
      return headers
    },
  }),
  tagTypes: ['Catalog', 'Session', 'Address', 'Order', 'Wishlist', 'Offers', 'Reviews', 'Cart'],
  endpoints: (build) => ({
    getCatalog: build.query<{ products: CatalogProduct[]; categories: CategoryNode[] }, void>({
      query: () => 'bossco.api.get_catalog',
      transformResponse: unwrap<{ products: CatalogProduct[]; categories: CategoryNode[] }>,
      providesTags: ['Catalog'],
    }),
    getStorefrontConfig: build.query<StorefrontConfig, void>({
      query: () => 'bossco.api.get_storefront_config',
      transformResponse: unwrap<StorefrontConfig>,
      keepUnusedDataFor: 3600,
    }),
    getProductDetails: build.query<ProductDetails, string>({
      query: (item_code) => ({ url: 'bossco.api.get_product', params: { item_code } }),
      transformResponse: unwrap<ProductDetails>,
      providesTags: ['Catalog'],
    }),
    getRelatedProducts: build.query<RelatedProducts, string>({
      query: (item_code) => ({ url: 'bossco.api.get_related_products', params: { item_code } }),
      transformResponse: unwrap<RelatedProducts>,
    }),
    // Priced by ERPNext exactly as checkout will be; nothing is saved
    getCartQuote: build.query<CartQuote, { items: CartItemRow[]; shipping_method: ShippingMethod; coupon_code?: string }>({
      query: ({ items, shipping_method, coupon_code }) => ({
        url: 'bossco.api.get_cart_quote',
        params: { items: JSON.stringify(items), shipping_method, coupon_code: coupon_code || undefined },
      }),
      transformResponse: unwrap<CartQuote>,
      providesTags: ['Catalog'],
      keepUnusedDataFor: 30,
    }),
    getActiveOffers: build.query<StoreOffer[], void>({
      query: () => 'bossco.offers.get_active_offers',
      transformResponse: unwrap<StoreOffer[]>,
      providesTags: ['Offers'],
      keepUnusedDataFor: 600,
    }),
    getReviews: build.query<ReviewPage, { item_code: string; sort: ReviewSort; start: number; limit: number; rating?: number }>({
      query: (params) => ({ url: 'bossco.reviews.get_reviews', params }),
      transformResponse: unwrap<ReviewPage>,
      providesTags: (_result, _error, { item_code }) => [{ type: 'Reviews', id: item_code }, 'Reviews'],
    }),
    submitReview: build.mutation<{ status: string; message: string }, { item_code: string; rating: number; title: string; comment: string }>({
      query: post('bossco.reviews.submit_review'),
      transformResponse: unwrap<{ status: string; message: string }>,
      transformErrorResponse: errorMessage,
      invalidatesTags: (_result, _error, { item_code }) => [{ type: 'Reviews', id: item_code }, 'Catalog'],
    }),
    voteHelpful: build.mutation<{ helpful: number; votedHelpful: boolean }, { review: string; helpful: 0 | 1; item_code: string }>({
      query: ({ review, helpful }) => ({ url: 'bossco.reviews.vote_helpful', method: 'POST', body: { review, helpful } }),
      transformResponse: unwrap<{ helpful: number; votedHelpful: boolean }>,
      transformErrorResponse: errorMessage,
      invalidatesTags: (_result, _error, { item_code }) => [{ type: 'Reviews', id: item_code }],
    }),
    // Catalog page: filtering happens in ERPNext; undefined params are left out of the URL
    getProducts: build.query<ProductQueryResult, ProductQuery>({
      query: (params) => ({ url: 'bossco.api.get_products', params }),
      transformResponse: unwrap<ProductQueryResult>,
      providesTags: ['Catalog'],
    }),
    placeOrder: build.mutation<PlacedOrder, PlaceOrderRequest>({
      query: post('bossco.api.place_order'),
      transformResponse: unwrap<PlacedOrder>,
      transformErrorResponse: errorMessage,
      // stock is reserved and new addresses may have been saved
      invalidatesTags: ['Order', 'Catalog', 'Address', 'Offers'],
    }),

    getSession: build.query<Session, void>({
      query: () => 'bossco.account.get_session',
      transformResponse: unwrap<Session>,
      onQueryStarted: keepCsrfToken,
      providesTags: ['Session'],
    }),
    login: build.mutation<Session, { email: string; password: string }>({
      query: post('bossco.account.login'),
      transformResponse: unwrap<Session>,
      transformErrorResponse: errorMessage,
      onQueryStarted: keepCsrfToken,
      invalidatesTags: ['Session', 'Address', 'Order', 'Wishlist', 'Offers', 'Reviews', 'Cart'],
    }),
    signUp: build.mutation<Session, SignUpRequest>({
      query: post('bossco.account.sign_up'),
      transformResponse: unwrap<Session>,
      transformErrorResponse: errorMessage,
      onQueryStarted: keepCsrfToken,
      invalidatesTags: ['Session', 'Address', 'Order', 'Wishlist', 'Offers', 'Reviews', 'Cart'],
    }),
    logout: build.mutation<Session, void>({
      query: () => ({ url: 'bossco.account.logout', method: 'POST' }),
      transformResponse: unwrap<Session>,
      onQueryStarted: keepCsrfToken,
      invalidatesTags: ['Session', 'Address', 'Order', 'Wishlist', 'Offers', 'Reviews', 'Cart'],
    }),
    forgotPassword: build.mutation<{ message: string }, { email: string }>({
      query: post('bossco.account.forgot_password'),
      transformResponse: unwrap<{ message: string }>,
      transformErrorResponse: errorMessage,
    }),
    // Frappe's own reset endpoint: checks the emailed key, its expiry and the password policy, then logs in
    resetPassword: build.mutation<string, { key: string; new_password: string }>({
      query: post('frappe.core.doctype.user.user.update_password'),
      transformResponse: unwrap<string>,
      transformErrorResponse: (error) =>
        error.status === 410
          ? 'This reset link has expired or was already used. Request a new one.'
          : errorMessage(error),
      invalidatesTags: ['Session', 'Address', 'Order', 'Wishlist', 'Offers', 'Reviews', 'Cart'],
    }),
    updateProfile: build.mutation<Session, { first_name: string; last_name: string; phone: string }>({
      query: post('bossco.account.update_profile'),
      transformResponse: unwrap<Session>,
      transformErrorResponse: errorMessage,
      onQueryStarted: keepCsrfToken,
      invalidatesTags: ['Session'],
    }),
    changePassword: build.mutation<{ message: string }, { old_password: string; new_password: string }>({
      query: post('bossco.account.change_password'),
      transformResponse: unwrap<{ message: string }>,
      transformErrorResponse: errorMessage,
    }),

    getAddresses: build.query<Address[], void>({
      query: () => 'bossco.account.get_addresses',
      transformResponse: unwrap<Address[]>,
      providesTags: ['Address'],
    }),
    saveAddress: build.mutation<Address[], AddressInput>({
      query: (address) => ({ url: 'bossco.account.save_address', method: 'POST', body: { address } }),
      transformResponse: unwrap<Address[]>,
      transformErrorResponse: errorMessage,
      invalidatesTags: ['Address'],
    }),
    deleteAddress: build.mutation<Address[], string>({
      query: (name) => ({ url: 'bossco.account.delete_address', method: 'POST', body: { name } }),
      transformResponse: unwrap<Address[]>,
      transformErrorResponse: errorMessage,
      invalidatesTags: ['Address'],
    }),

    getOrders: build.query<Order[], { start: number; limit: number } | void>({
      query: (params) => ({ url: 'bossco.account.get_orders', params: params ?? undefined }),
      transformResponse: unwrap<Order[]>,
      providesTags: ['Order'],
    }),

    getCart: build.query<CartItemRow[], void>({
      query: () => 'bossco.cart.get_cart',
      transformResponse: unwrap<CartItemRow[]>,
      providesTags: ['Cart'],
    }),
    setCart: build.mutation<CartItemRow[], CartItemRow[]>({
      query: (items) => ({ url: 'bossco.cart.set_cart', method: 'POST', body: { items } }),
      transformResponse: unwrap<CartItemRow[]>,
    }),
    mergeCart: build.mutation<CartItemRow[], CartItemRow[]>({
      query: (items) => ({ url: 'bossco.cart.merge_cart', method: 'POST', body: { items } }),
      transformResponse: unwrap<CartItemRow[]>,
    }),

    // Frappe's built-in website endpoints
    sendContactMessage: build.mutation<unknown, { sender: string; subject: string; message: string }>({
      query: post('frappe.www.contact.send_message'),
      transformErrorResponse: errorMessage,
    }),
    subscribeNewsletter: build.mutation<unknown, { email: string }>({
      query: post('frappe.email.doctype.newsletter.newsletter.subscribe'),
      transformErrorResponse: errorMessage,
    }),

    getWishlist: build.query<string[], void>({
      query: () => 'bossco.account.get_wishlist',
      transformResponse: unwrap<string[]>,
      providesTags: ['Wishlist'],
    }),
    addToWishlist: build.mutation<string[], string>({
      query: (item_code) => ({ url: 'bossco.account.add_to_wishlist', method: 'POST', body: { item_code } }),
      transformResponse: unwrap<string[]>,
    }),
    removeFromWishlist: build.mutation<string[], string>({
      query: (item_code) => ({ url: 'bossco.account.remove_from_wishlist', method: 'POST', body: { item_code } }),
      transformResponse: unwrap<string[]>,
    }),
    mergeWishlist: build.mutation<string[], string[]>({
      query: (item_codes) => ({ url: 'bossco.account.merge_wishlist', method: 'POST', body: { item_codes } }),
      transformResponse: unwrap<string[]>,
    }),
  }),
})

export const {
  useGetCatalogQuery,
  useGetStorefrontConfigQuery,
  useGetProductDetailsQuery,
  useGetRelatedProductsQuery,
  useGetCartQuoteQuery,
  useGetActiveOffersQuery,
  useGetReviewsQuery,
  useSubmitReviewMutation,
  useVoteHelpfulMutation,
  useResetPasswordMutation,
  useSendContactMessageMutation,
  useSubscribeNewsletterMutation,
  useGetProductsQuery,
  usePlaceOrderMutation,
  useGetSessionQuery,
  useLoginMutation,
  useSignUpMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useGetAddressesQuery,
  useSaveAddressMutation,
  useDeleteAddressMutation,
  useGetOrdersQuery,
} = storeApi
