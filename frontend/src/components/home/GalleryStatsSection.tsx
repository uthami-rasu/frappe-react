import { ImageGallery } from './ImageGallery'
import { StatsBand } from './StatsBand'

export function GalleryStatsSection() {
  return (
    <section className="gallery-section relative overflow-hidden bg-[#f7f2e8] pt-24 dark:bg-stone-950" id="gallery">
      <div className="gallery-orb gallery-orb-one" />
      <div className="gallery-orb gallery-orb-two" />
      <div className="relative px-5 pb-24 sm:px-8">
        <header className="mx-auto mb-12 flex max-w-[1180px] flex-col gap-5 md:flex-row md:items-end md:justify-between" data-reveal>
          <div>
            <p className="eyebrow">Inside Bossco</p>
            <h2 className="mt-3 max-w-[620px] font-display text-[clamp(2.8rem,5vw,4.8rem)] font-bold leading-[.9] tracking-[-.045em] text-[#173f32] dark:text-white">Goodness looks<br /><span className="italic text-[#bc7f3d]">this delicious.</span></h2>
          </div>
          <p className="max-w-[340px] text-sm leading-7 text-stone-500">From careful sourcing to joyful unboxing—take a peek at the colours, textures, and people behind every pack.</p>
        </header>
        <ImageGallery />
      </div>
      <StatsBand />
    </section>
  )
}
