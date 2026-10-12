import { useGetSessionQuery } from '../features/api/storeApi'
import type { Session } from '../types/account'

const selectSession = ({ data, isLoading }: { data?: Session; isLoading: boolean }) => ({ user: data?.user ?? null, isLoading })

export function useSession() {
  const { user, isLoading } = useGetSessionQuery(undefined, { selectFromResult: selectSession })
  return { user, isLoading }
}
