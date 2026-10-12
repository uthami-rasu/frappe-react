import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { Address, AddressInput, Order, Session } from '../../types/account'
import type {
  CatalogProduct, CategoryNode, CheckoutAddress, CheckoutContact, PaymentDetails, PlacedOrder, ProductQuery, ProductQueryResult, ShippingMethod,
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
}

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
function getFrappeErrorMessage(data: unknown) {
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
  tagTypes: ['Catalog', 'Session', 'Address', 'Order', 'Wishlist'],
  endpoints: (build) => ({
    getCatalog: build.query<{ products: CatalogProduct[]; categories: CategoryNode[] }, void>({
      query: () => 'bossco.api.get_catalog',
      transformResponse: unwrap<{ products: CatalogProduct[]; categories: CategoryNode[] }>,
      providesTags: ['Catalog'],
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
      transformErrorResponse: (error) => getFrappeErrorMessage(error.data),
      // stock is reserved and new addresses may have been saved
      invalidatesTags: ['Order', 'Catalog', 'Address'],
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
      transformErrorResponse: (error) => getFrappeErrorMessage(error.data),
      onQueryStarted: keepCsrfToken,
      invalidatesTags: ['Session', 'Address', 'Order', 'Wishlist'],
    }),
    signUp: build.mutation<Session, SignUpRequest>({
      query: post('bossco.account.sign_up'),
      transformResponse: unwrap<Session>,
      transformErrorResponse: (error) => getFrappeErrorMessage(error.data),
      onQueryStarted: keepCsrfToken,
      invalidatesTags: ['Session', 'Address', 'Order', 'Wishlist'],
    }),
    logout: build.mutation<Session, void>({
      query: () => ({ url: 'bossco.account.logout', method: 'POST' }),
      transformResponse: unwrap<Session>,
      onQueryStarted: keepCsrfToken,
      invalidatesTags: ['Session', 'Address', 'Order', 'Wishlist'],
    }),
    forgotPassword: build.mutation<{ message: string }, { email: string }>({
      query: post('bossco.account.forgot_password'),
      transformResponse: unwrap<{ message: string }>,
      transformErrorResponse: (error) => getFrappeErrorMessage(error.data),
    }),
    updateProfile: build.mutation<Session, { first_name: string; last_name: string; phone: string }>({
      query: post('bossco.account.update_profile'),
      transformResponse: unwrap<Session>,
      transformErrorResponse: (error) => getFrappeErrorMessage(error.data),
      onQueryStarted: keepCsrfToken,
      invalidatesTags: ['Session'],
    }),
    changePassword: build.mutation<{ message: string }, { old_password: string; new_password: string }>({
      query: post('bossco.account.change_password'),
      transformResponse: unwrap<{ message: string }>,
      transformErrorResponse: (error) => getFrappeErrorMessage(error.data),
    }),

    getAddresses: build.query<Address[], void>({
      query: () => 'bossco.account.get_addresses',
      transformResponse: unwrap<Address[]>,
      providesTags: ['Address'],
    }),
    saveAddress: build.mutation<Address[], AddressInput>({
      query: (address) => ({ url: 'bossco.account.save_address', method: 'POST', body: { address } }),
      transformResponse: unwrap<Address[]>,
      transformErrorResponse: (error) => getFrappeErrorMessage(error.data),
      invalidatesTags: ['Address'],
    }),
    deleteAddress: build.mutation<Address[], string>({
      query: (name) => ({ url: 'bossco.account.delete_address', method: 'POST', body: { name } }),
      transformResponse: unwrap<Address[]>,
      transformErrorResponse: (error) => getFrappeErrorMessage(error.data),
      invalidatesTags: ['Address'],
    }),

    getOrders: build.query<Order[], void>({
      query: () => 'bossco.account.get_orders',
      transformResponse: unwrap<Order[]>,
      providesTags: ['Order'],
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
