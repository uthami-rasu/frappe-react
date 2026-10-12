import { Minus, Plus, Trash2 } from 'lucide-react'

type QuantityStepperProps = {
  value: number
  max?: number
  onChange: (value: number) => void
  // shown instead of "−" at 1, e.g. to remove a cart line
  onRemove?: () => void
  label: string
}

export function QuantityStepper({ value, max = 100, onChange, onRemove, label }: QuantityStepperProps) {
  const atMin = value <= 1
  return (
    <div className="sf-qty" role="group" aria-label={`Quantity for ${label}`}>
      {atMin && onRemove ? (
        <button type="button" onClick={onRemove} aria-label={`Remove ${label}`}><Trash2 size={14} /></button>
      ) : (
        <button type="button" onClick={() => onChange(value - 1)} disabled={atMin} aria-label="Decrease quantity"><Minus size={14} /></button>
      )}
      <output aria-live="polite">{value}</output>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase quantity"><Plus size={14} /></button>
    </div>
  )
}
