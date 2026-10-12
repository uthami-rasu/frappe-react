type IconProps = {
  size?: number
}

/**
 * Brand marks drawn in lucide's outline style — lucide 1.x no longer ships
 * social glyphs, so these live locally to keep the icon language consistent.
 */
const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
})

export function InstagramIcon({ size = 17 }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="2" y="2" width="20" height="20" rx="5.5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37Z" />
      <path d="M17.5 6.5h.01" />
    </svg>
  )
}

export function FacebookIcon({ size = 17 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3Z" />
    </svg>
  )
}

export function WhatsAppIcon({ size = 17 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M3.2 20.8 4.5 17a8.5 8.5 0 1 1 3.3 3.2l-4.6.6Z" />
      <g transform="translate(6.6 6.6) scale(.44)">
        <path
          vectorEffect="non-scaling-stroke"
          d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.2 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z"
        />
      </g>
    </svg>
  )
}
