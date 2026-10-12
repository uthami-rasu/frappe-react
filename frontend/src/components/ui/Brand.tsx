import bosscoLogo from '../../assets/images/Bossco_Logo__2__page-0001-removebg-preview.webp'

export function Brand() {
  return (
    <a
      className="brand-lockup group flex shrink-0 items-center gap-2.5"
      href="#home"
      aria-label="Bossco home"
    >
      <img
        className="size-[54px] object-contain transition-transform duration-500 group-hover:rotate-[-4deg] group-hover:scale-105 sm:size-[72px]"
        src={bosscoLogo}
        alt="Bossco — House of Dry Fruits and Nuts"
      />
      <span className="flex flex-col justify-center text-[#173f32] dark:text-stone-50">
        <span className="text-[1.1rem] font-bold leading-none tracking-[.19em] sm:text-[1.3rem]">BOSSCO</span>
        <span className="mt-1.5 text-[8px] font-semibold uppercase leading-none tracking-[.24em] text-[#aa753a]">Nuts • Naturals</span>
      </span>
    </a>
  )
}
