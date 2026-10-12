import { useGetSessionQuery } from '../features/api/storeApi'

export function useSession() {
  const { data, isLoading } = useGetSessionQuery()
  return { user: data?.user ?? null, isLoading }
}
