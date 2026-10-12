import { X } from 'lucide-react'
import { useEffect, useEffectEvent, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { getLenis } from '../../app/lenis'

type ModalProps = {
  open: boolean
  onClose: () => void
  title: string
  // drawer from the side, or a centred dialog
  variant?: 'right' | 'left' | 'dialog'
  hideTitle?: boolean
  footer?: ReactNode
  children: ReactNode
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Accessible drawer/dialog: focus moves in and is trapped, Esc and the backdrop close it, focus returns after. */
export function Modal({ open, onClose, title, variant = 'right', hideTitle = false, footer, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const close = useEffectEvent(onClose)

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const lenis = getLenis()
    lenis?.stop()
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    const panel = panelRef.current
    ;(panel?.querySelector<HTMLElement>('[data-autofocus]') ?? panel?.querySelector<HTMLElement>(FOCUSABLE) ?? panel)?.focus()

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        close()
      }
      if (event.key !== 'Tab' || !panel) return
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((item) => item.offsetParent !== null)
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      lenis?.start()
      previous?.focus?.()
    }
  }, [open])

  if (!open) return null
  const panelClass = variant === 'dialog' ? 'sf-dialog' : `sf-drawer sf-drawer-${variant}`
  return createPortal(
    <>
      <div className="sf-overlay" onClick={onClose} aria-hidden="true" />
      <div ref={panelRef} className={panelClass} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} data-lenis-prevent>
        <div className={variant === 'dialog' && hideTitle ? 'sf-sr-only' : 'sf-drawer-head'}>
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="sf-icon-btn" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>
        {variant === 'dialog' ? children : <div className="sf-drawer-body">{children}</div>}
        {footer && <div className="sf-drawer-foot">{footer}</div>}
      </div>
    </>,
    document.body,
  )
}
