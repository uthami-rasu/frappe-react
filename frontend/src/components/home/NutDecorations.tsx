import leftNuts from '../../assets/images/ChatGPT Image Jun 12, 2026, 04_05_10 PM 4.webp'
import rightNuts from '../../assets/images/ChatGPT Image Jun 12, 2026, 04_05_10 PM 3.webp'

export function NutDecorations() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-0" aria-hidden="true">
      <img
        className="absolute -left-8 -top-14 h-[280px] w-[190px] select-none object-fill md:-top-[72px] md:h-[360px] md:w-[260px] xl:-top-[110px] xl:h-[560px] xl:w-[430px]"
        src={leftNuts}
        alt=""
      />
      <img
        className="absolute -right-8 -top-14 h-[280px] w-[190px] select-none object-fill md:-top-[72px] md:h-[360px] md:w-[260px] xl:-top-[110px] xl:h-[560px] xl:w-[430px]"
        src={rightNuts}
        alt=""
      />
    </div>
  )
}
