export const accountTabs = ['account', 'address', 'orders', 'wishlist'] as const
export type AccountTab = (typeof accountTabs)[number]
