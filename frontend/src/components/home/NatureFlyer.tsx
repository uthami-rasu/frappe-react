type NatureFlyerProps = {
  kind: 'bee' | 'butterfly'
  flight: string
  src: string
}

/**
 * Layered so each transform stays independent:
 * path (where it travels) → heading (which way it faces) → pitch (nose up/down + depth) → body (wingbeat).
 */
export function NatureFlyer({ kind, flight, src }: NatureFlyerProps) {
  return (
    <div className={`nature-flyer ${flight}`}>
      <div className="nature-flyer-heading">
        <div className="nature-flyer-pitch">
          <img
            className={`nature-flyer-body nature-flyer-${kind}`}
            src={src}
            alt=""
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </div>
  )
}
