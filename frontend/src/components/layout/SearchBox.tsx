import { Search } from 'lucide-react'
import { memo, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { buildHash, navigate } from '../../app/router'
import { categoryWithDescendants, searchScore } from '../../features/catalog/catalogQuery'
import { useCatalog } from '../../hooks/useCatalog'
import { formatMoney } from '../../utils/money'
import { productHref } from '../../utils/product'

const MAX_SUGGESTIONS = 6

function Highlight({ text, query }: { text: string; query: string }) {
  const word = query.trim().split(/\s+/)[0]
  const index = word ? text.toLowerCase().indexOf(word.toLowerCase()) : -1
  if (index < 0) return <>{text}</>
  return <>{text.slice(0, index)}<mark>{text.slice(index, index + word.length)}</mark>{text.slice(index + word.length)}</>
}

/** Header search with category scope and live product/category suggestions (combobox pattern). */
export const SearchBox = memo(function SearchBox({ initialQuery = '', initialCategory = '' }: { initialQuery?: string; initialCategory?: string }) {
  const { products, categories } = useCatalog()
  const [query, setQuery] = useState(initialQuery)
  const [scope, setScope] = useState(initialCategory)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const topCategories = useMemo(() => categories.filter((category) => category.depth === 0), [categories])

  const suggestions = useMemo(() => {
    const text = query.trim()
    if (!text) return { products: [], categories: [] }
    const inScope = scope ? categoryWithDescendants(categories, scope) : null
    const matched = products
      .filter((product) => !inScope || inScope.has(product.category))
      .map((product) => ({ product, score: searchScore(product, text) }))
      .filter((match) => match.score > 0)
      .sort((a, b) => b.score - a.score || Number(b.product.inStock) - Number(a.product.inStock))
      .slice(0, MAX_SUGGESTIONS)
      .map((match) => match.product)
    const lower = text.toLowerCase()
    return { products: matched, categories: categories.filter((category) => category.name.toLowerCase().includes(lower)).slice(0, 3) }
  }, [query, scope, products, categories])

  const options = [
    ...suggestions.categories.map((category) => ({ key: `c-${category.name}`, href: buildHash('honey', { category: category.name }) })),
    ...suggestions.products.map((product) => ({ key: `p-${product.id}`, href: productHref(product) })),
  ]

  const submit = (event?: FormEvent) => {
    event?.preventDefault()
    setOpen(false)
    if (active >= 0 && options[active]) {
      navigate(options[active].href)
      return
    }
    navigate(buildHash('honey', { q: query.trim(), category: scope || null }))
    inputRef.current?.blur()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActive((current) => (options.length ? (current + step + options.length + 1) % (options.length + 1) - 1 : -1))
    } else if (event.key === 'Escape') {
      setOpen(false)
      setActive(-1)
    }
  }

  const showList = open && query.trim().length > 0
  const categoryOffset = 0
  const productOffset = suggestions.categories.length
  return (
    <div className="sf-search" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}>
      <form role="search" onSubmit={submit}>
        <label className="sf-sr-only" htmlFor={`${listId}-scope`}>Search in</label>
        <select id={`${listId}-scope`} value={scope} onChange={(event) => setScope(event.target.value)}>
          <option value="">All</option>
          {topCategories.map((category) => <option key={category.name} value={category.name}>{category.name}</option>)}
        </select>
        <label className="sf-sr-only" htmlFor={`${listId}-input`}>Search products</label>
        <input
          ref={inputRef}
          id={`${listId}-input`}
          type="search"
          value={query}
          placeholder="Search nuts, dried fruit, honey…"
          autoComplete="off"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 && options[active] ? `${listId}-${options[active].key}` : undefined}
          onChange={(event) => { setQuery(event.target.value); setOpen(true); setActive(-1) }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        <button type="submit" aria-label="Search"><Search size={20} /></button>
      </form>
      {showList && (
        <div className="sf-suggest" id={listId} role="listbox" aria-label="Search suggestions">
          {suggestions.categories.length > 0 && <p className="sf-suggest-head" role="presentation">Categories</p>}
          {suggestions.categories.map((category, position) => {
            const index = categoryOffset + position
            return (
              <a key={category.name} id={`${listId}-c-${category.name}`} role="option" aria-selected={active === index} className="sf-suggest-item" href={buildHash('honey', { category: category.name })} onClick={() => setOpen(false)}>
                <Search size={16} className="text-[var(--sf-muted)]" /> <span><Highlight text={category.name} query={query} /> <span className="sf-hint">· {category.count} products</span></span>
              </a>
            )
          })}
          {suggestions.products.length > 0 && <p className="sf-suggest-head" role="presentation">Products</p>}
          {suggestions.products.map((product, position) => {
            const index = productOffset + position
            return (
              <a key={product.id} id={`${listId}-p-${product.id}`} role="option" aria-selected={active === index} className="sf-suggest-item" href={productHref(product)} onClick={() => setOpen(false)}>
                <img src={product.image} alt="" width={40} height={40} loading="lazy" />
                <span className="min-w-0 flex-1 truncate"><Highlight text={product.name} query={query} /></span>
                <b className="text-sm">{formatMoney(product.price)}</b>
              </a>
            )
          })}
          {!options.length && <p className="px-4 py-3 text-sm text-[var(--sf-muted)]">No matches yet. Press Enter to search the whole store.</p>}
          <button type="button" className="sf-suggest-item w-full border-t border-[var(--sf-line)] font-semibold" onClick={() => submit()}>
            <Search size={16} /> Search for “{query.trim()}”{scope ? ` in ${scope}` : ''}
          </button>
        </div>
      )}
    </div>
  )
})
