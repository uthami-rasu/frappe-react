type BenefitCardProps = {
  title: string
  description: string
  icon: string
}

export function BenefitCard({ title, description, icon }: BenefitCardProps) {
  return (
    <article className="group relative flex min-h-[158px] flex-col items-center justify-center overflow-hidden rounded-[22px] border border-[#ebe4d9] bg-white/95 px-3 py-5 text-center shadow-[0_14px_35px_rgba(55,36,17,0.09)] transition duration-500 hover:-translate-y-2 hover:border-[#d6b173] dark:border-stone-800 dark:bg-stone-900 dark:shadow-black/20 xl:min-h-[176px] xl:px-4 xl:py-6" data-reveal>
      <span className="mb-3 grid size-12 place-items-center rounded-2xl bg-[#f7f1e6] transition duration-500 group-hover:rotate-6 group-hover:scale-110 dark:bg-stone-800">
        <img className="size-10 object-contain" src={icon} alt="" aria-hidden="true" />
      </span>
      <h2 className="text-[16px] font-semibold text-stone-700 dark:text-stone-100">
        {title}
      </h2>
      <p className="mt-1 text-[11px] text-stone-600 dark:text-stone-400">
        {description}
      </p>
      <span className="absolute bottom-0 h-1 w-20 rounded-t-full bg-[#e6b577] transition-all duration-300 group-hover:w-28" />
    </article>
  )
}
