import { galleryImages } from '../../constants/galleryImages'

export function ImageGallery() {
  const layouts = [
    'md:col-span-5 md:row-span-2',
    'md:col-span-3',
    'md:col-span-4',
    'md:col-span-4',
    'md:col-span-3',
  ]

  return (
    <div className="mx-auto grid max-w-[1180px] grid-cols-2 gap-3 md:auto-rows-[230px] md:grid-cols-12 md:gap-4">
      {galleryImages.map((image, index) => (
        <div className={`gallery-tile group relative min-h-[190px] overflow-hidden rounded-[24px] ${layouts[index]}`} key={index} data-reveal>
          <img
            className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
            src={image.src}
            alt={image.alt}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#102d22]/70 via-transparent to-transparent opacity-40 transition group-hover:opacity-75" />
          <span className="absolute bottom-4 left-4 translate-y-3 text-[10px] font-bold uppercase tracking-[.16em] text-white opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">{index === 0 ? 'The Bossco spread' : index === 1 ? 'Freshly packed' : index === 2 ? 'Naturally vibrant' : index === 3 ? 'Made to share' : 'Everyday goodness'}</span>
        </div>
      ))}
    </div>
  )
}
