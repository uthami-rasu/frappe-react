import { CheckCircle2, KeyRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { AuthLayout } from '../components/auth/AuthLayout'
import { PasswordField } from '../components/auth/AuthFields'
import { useResetPasswordMutation } from '../features/api/storeApi'
import { EmptyState } from '../components/ui/Feedback'
import { checkPassword } from '../utils/password'

/**
 * Opened from the reset email (#reset-password?key=…). The key and the new password go to
 * Frappe's own update_password, which checks the key, its expiry and the password policy,
 * then signs the shopper in. Nothing here can change a password without a valid key.
 */
export function ResetPasswordPage({ resetKey }: { resetKey: string }) {
  const [resetPassword, { isLoading, isSuccess }] = useResetPasswordMutation()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({})
  const [formError, setFormError] = useState<string | null>(null)

  if (!resetKey) {
    return (
      <AuthLayout title="Reset link missing">
        <EmptyState icon={<KeyRound size={24} />} title="This link isn’t complete" action={<a href="#login" className="sf-btn sf-btn-primary sf-btn-sm">Request a new link</a>}>
          Open the link from your email again, or request a new one from the sign-in page.
        </EmptyState>
      </AuthLayout>
    )
  }

  if (isSuccess) {
    return (
      <AuthLayout title="Password updated">
        <div className="grid gap-5 text-center" role="status">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-[var(--sf-success-bg)] text-[var(--sf-success)]"><CheckCircle2 size={28} /></span>
          <p className="text-sm text-[var(--sf-ink-soft)]">Your new password is saved and you’re signed in.</p>
          <a href="#account" className="sf-btn sf-btn-primary sf-btn-block">Go to my account</a>
          <a href="#honey" className="sf-btn sf-btn-ghost sf-btn-sm">Continue shopping</a>
        </div>
      </AuthLayout>
    )
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const strength = checkPassword(password)
    const found = {
      password: !password ? 'Enter a new password' : strength.acceptable ? undefined : strength.problems[0],
      confirm: confirm !== password ? 'Passwords don’t match' : undefined,
    }
    setErrors(found)
    setFormError(null)
    if (found.password || found.confirm) return
    try {
      await resetPassword({ key: resetKey, new_password: password }).unwrap()
      window.history.replaceState(window.history.state, '', '#reset-password')
    } catch (error) {
      setFormError(typeof error === 'string' ? error : 'Something went wrong. Please try again.')
    }
  }

  return (
    <AuthLayout title="Choose a new password" subtitle="Use at least 8 characters with a mix of letters and numbers or symbols.">
      <form className="grid gap-5" onSubmit={submit} noValidate>
        {formError && (
          <p className="sf-alert sf-alert-error" role="alert">
            <span>{formError}{/expired|used/i.test(formError) && <> <a className="sf-link" href="#login">Request a new link</a></>}</span>
          </p>
        )}
        <PasswordField label="New password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} error={errors.password} showStrength autoFocus />
        <PasswordField label="Confirm new password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} error={errors.confirm} />
        <button type="submit" className="sf-btn sf-btn-primary sf-btn-block" disabled={isLoading}>{isLoading ? 'Saving…' : 'Save new password'}</button>
        <a href="#login" className="sf-link justify-self-center text-sm">Back to sign in</a>
      </form>
    </AuthLayout>
  )
}
