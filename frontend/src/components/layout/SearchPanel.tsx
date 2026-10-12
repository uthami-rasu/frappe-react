import { ArrowUpRight, Search, TrendingUp, X } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { buildHash, navigate } from '../../app/router'
import { searchScore } from '../../features/catalog/catalogQuery'
import { useCatalog } from '../../hooks/useCatalog'
import { formatMoney } from '../../utils/money'

type SearchPanelProps = {
  onClose: () => void
}

export function SearchPanel({ onClose }: SearchPanelProps) {
  const [query, setQuery] = useState('')
  const { products } = useCatalog()
  // real best sellers (units ordered recently), not a fixed list
  const popularSearches = useMemo(() => [...products].sort((a, b) => b.sold - a.sold).slice(0, 4).map((product) => product.name), [products])
  const results = useMemo(() => {
    const text = query.trim()
    return (text
      ? products.map((product) => ({ product, score: searchScore(product, text) })).filter((match) => match.score > 0).sort((a, b) => b.score - a.score).map((match) => match.product)
      : products.filter((product) => product.featured)
    ).slice(0, 4)
  }, [products, query])
  const submit = (event: FormEvent) => {
    event.preventDefault()
    onClose()
    navigate(buildHash('honey', { q: query.trim() }))
  }

  return (
    <div className="search-backdrop fixed inset-0 z-[80] bg-[#10281f]/45 px-3 pt-3 backdrop-blur-md sm:px-6 sm:pt-16" role="dialog" aria-modal="true" aria-label="Search products" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="search-panel mx-auto max-w-[860px] overflow-hidden rounded-[28px] border border-white/60 bg-[#fffdf8] shadow-[0_30px_100px_rgba(15,35,27,.3)] dark:border-stone-700 dark:bg-stone-950">
        <form role="search" onSubmit={submit} className="flex items-center gap-3 border-b border-[#e9e2d7] px-5 py-4 sm:px-7">
          <Search className="text-[#557565]" size={21} aria-hidden="true" />
          <label htmlFor="search-panel-input" className="sf-sr-only">Search products</label>
          <input id="search-panel-input" type="search" enterKeyHint="search" autoFocus className="h-11 min-w-0 flex-1 bg-transparent text-base text-stone-900 outline-none placeholder:text-stone-400 dark:text-white" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search almonds, berries, hampers…" />
          <kbd className="hidden rounded-md border border-stone-200 bg-white px-2 py-1 text-[10px] text-stone-400 sm:block">ESC</kbd>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close search"><X size={19} /></button>
        </form>

        <div className="grid gap-6 p-5 sm:p-7 md:grid-cols-[180px_1fr]">
          <aside>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">Popular now</p>
            <div className="mt-3 flex flex-wrap gap-2 md:flex-col md:items-start">
              {popularSearches.map((term) => (
                <button className="group flex items-center gap-2 rounded-full bg-[#f4efe5] px-3 py-2 text-xs font-semibold text-[#315545] transition hover:bg-[#e7dbc6] md:bg-transparent md:px-0" key={term} type="button" onClick={() => setQuery(term)}>
                  <TrendingUp size={13} /> {term}
                </button>
              ))}
            </div>
          </aside>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">{query ? `${results.length} matches` : 'Quick picks'}</p>
              <a className="flex items-center gap-1 text-xs font-bold text-[#315545]" href={buildHash('honey', { q: query.trim() })} onClick={onClose}>View all <ArrowUpRight size={13} /></a>
            </div>
            {results.length ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {results.map((product) => (
                  <a className="group" href={`#product/${product.slug}`} key={product.id} onClick={onClose}>
                    <div className="aspect-square overflow-hidden rounded-2xl bg-[#f2ece2]"><img className="h-full w-full object-cover transition duration-500 group-hover:scale-110" src={product.image} alt="" loading="lazy" /></div>
                    <p className="mt-2 line-clamp-1 text-xs font-semibold text-stone-800 dark:text-white">{product.name}</p>
                    <p className="mt-0.5 text-xs font-bold text-[#a36932]">{formatMoney(product.price)}</p>
                  </a>
                ))}
              </div>
            ) : <div className="grid min-h-40 place-items-center rounded-2xl border border-dashed border-stone-300 text-sm text-stone-400">No snacks found. Try “almonds”.</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
