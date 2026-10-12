import { ChevronLeft, ChevronRight } from 'lucide-react'

export function ProductPagination() {
  return (
    <nav className="flex items-center justify-center gap-4" aria-label="Product pages">
      <button
        className="grid size-9 cursor-not-allowed place-items-center rounded-full border border-[#ead8c3] bg-[#fffaf3] text-[#d7b895] opacity-65 dark:border-stone-700 dark:bg-stone-900"
        type="button"
        aria-label="Previous product page"
        disabled
      >
        <ChevronLeft aria-hidden="true" size={17} strokeWidth={1.8} />
      </button>
      <button
        className="grid size-9 place-items-center rounded-full border border-[#dfbd97] bg-[#fff8ef] text-[#a86934] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#f8ead9] dark:border-stone-700 dark:bg-stone-900 dark:text-amber-300"
        type="button"
        aria-label="Next product page"
      >
        <ChevronRight aria-hidden="true" size={17} strokeWidth={1.8} />
      </button>
    </nav>
  )
}
