import type { Testimonial } from '../../types/testimonial'

type TestimonialThumbnailProps = {
  testimonial: Testimonial
  onSelect: (testimonial: Testimonial) => void
}

export function TestimonialThumbnail({
  testimonial,
  onSelect,
}: TestimonialThumbnailProps) {
  return (
    <button
      className="group h-[205px] overflow-hidden bg-stone-100 text-left sm:h-[245px] lg:h-[270px]"
      onClick={() => onSelect(testimonial)}
      type="button"
      aria-label={`Read ${testimonial.name}'s testimonial`}
    >
      <img
        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        src={testimonial.image}
        alt={testimonial.name}
        loading="lazy"
      />
    </button>
  )
}
