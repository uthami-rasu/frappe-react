type CategoryFiltersProps = {
  activeFilter: string
  categories: string[]
  onChange: (filter: string) => void
}

export function CategoryFilters({
  activeFilter,
  categories,
  onChange,
}: CategoryFiltersProps) {
  const allCategories = ['All', ...categories]

  return (
    <div className="flex flex-wrap items-center justify-center gap-2" aria-label="Product categories">
      {allCategories.map((category) => {
        const isActive = activeFilter === category

        return (
          <button
            className={`category-pill rounded-full border px-4 py-2 text-xs font-medium transition duration-300 ${
              isActive
                ? 'border-[#173f32] bg-[#173f32] text-white shadow-[0_8px_18px_rgba(23,63,50,.18)]'
                : 'border-stone-200 bg-white text-stone-600 hover:-translate-y-0.5 hover:border-[#dda96e] hover:text-[#a8682f] dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300'
            }`}
            key={category}
            onClick={() => onChange(category)}
            type="button"
          >
            {category}
          </button>
        )
      })}
    </div>
  )
}
