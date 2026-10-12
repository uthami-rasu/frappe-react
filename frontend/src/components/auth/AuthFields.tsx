import { AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { checkPassword } from '../../utils/password'

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: ReactNode; optional?: boolean }

export function TextField({ label, error, hint, optional, id, ...input }: FieldProps) {
  const generated = useId()
  const fieldId = id ?? generated
  const describedBy = [error ? `${fieldId}-error` : null, hint ? `${fieldId}-hint` : null].filter(Boolean).join(' ') || undefined
  return (
    <div className="sf-field">
      <label className="sf-label" htmlFor={fieldId}>{label}{optional && <span className="font-normal text-[var(--sf-muted)]"> (optional)</span>}</label>
      <input id={fieldId} className="sf-input" aria-invalid={Boolean(error)} aria-describedby={describedBy} {...input} />
      {hint && !error && <p id={`${fieldId}-hint`} className="sf-hint">{hint}</p>}
      {error && <p id={`${fieldId}-error`} className="sf-error"><AlertCircle size={13} /> {error}</p>}
    </div>
  )
}

type PasswordFieldProps = Omit<FieldProps, 'type'> & { showStrength?: boolean; personal?: string[] }

export function PasswordField({ label, error, hint, id, showStrength = false, personal = [], value, ...input }: PasswordFieldProps) {
  const generated = useId()
  const fieldId = id ?? generated
  const [visible, setVisible] = useState(false)
  const strength = showStrength && typeof value === 'string' && value ? checkPassword(value, personal) : null
  const describedBy = [error ? `${fieldId}-error` : null, strength || hint ? `${fieldId}-hint` : null].filter(Boolean).join(' ') || undefined
  return (
    <div className="sf-field">
      <label className="sf-label" htmlFor={fieldId}>{label}</label>
      <div className="sf-input-wrap">
        <input id={fieldId} className="sf-input" type={visible ? 'text' : 'password'} value={value} aria-invalid={Boolean(error)} aria-describedby={describedBy} {...input} />
        <button type="button" className="sf-icon-btn sf-input-action" onClick={() => setVisible((shown) => !shown)} aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible}>
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {strength && (
        <div id={`${fieldId}-hint`} className="grid gap-1.5" aria-live="polite">
          <div className="sf-meter" data-score={strength.score} aria-hidden="true"><span /><span /><span /><span /></div>
          <p className="sf-hint"><b>{strength.label}</b>{strength.problems.length ? ` · ${strength.problems[0]}` : ''}</p>
        </div>
      )}
      {!strength && hint && !error && <p id={`${fieldId}-hint`} className="sf-hint">{hint}</p>}
      {error && <p id={`${fieldId}-error`} className="sf-error"><AlertCircle size={13} /> {error}</p>}
    </div>
  )
}
