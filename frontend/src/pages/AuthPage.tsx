import { ArrowLeft, CheckCircle2, MailCheck } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { AuthLayout } from '../components/auth/AuthLayout'
import { PasswordField, TextField } from '../components/auth/AuthFields'
import { useForgotPasswordMutation, useLoginMutation, useSignUpMutation } from '../features/api/storeApi'
import { checkPassword, isValidEmail } from '../utils/password'

type AuthMode = 'login' | 'register' | 'forgot'

type AuthPageProps = {
  initialMode?: AuthMode
  // hash route to open after signing in, e.g. '#checkout'
  next?: string
}

type Errors = Record<string, string | undefined>

const errorText = (error: unknown) => (typeof error === 'string' ? error : 'Please check your connection and try again.')

function FormAlert({ message }: { message: string | null }) {
  if (!message) return null
  return <p className="sf-alert sf-alert-error" role="alert">{message}</p>
}

function focusFirstError(form: HTMLFormElement | null) {
  window.requestAnimationFrame(() => form?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
}

function LoginForm({ next, onForgot, onRegister }: { next: string; onForgot: (email: string) => void; onRegister: () => void }) {
  const [login, { isLoading }] = useLoginMutation()
  const [values, setValues] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const validate = () => ({
    email: !values.email.trim() ? 'Enter your email address' : !isValidEmail(values.email) ? 'Enter a valid email address, e.g. name@example.com' : undefined,
    password: values.password ? undefined : 'Enter your password',
  })

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const found = validate()
    setErrors(found)
    setFormError(null)
    if (Object.values(found).some(Boolean)) return focusFirstError(formRef.current)
    try {
      const session = await login({ email: values.email.trim(), password: values.password }).unwrap()
      toast.success(`Welcome back, ${session.user?.firstName || 'friend'}!`)
      window.location.hash = next
    } catch (error) {
      setFormError(errorText(error) === 'Invalid Login. Try again.' ? 'That email and password don’t match. Try again or reset your password.' : errorText(error))
    }
  }

  return (
    <form ref={formRef} className="grid gap-5" onSubmit={submit} noValidate>
      <FormAlert message={formError} />
      <TextField label="Email" type="email" name="email" autoComplete="email" inputMode="email" required value={values.email} error={errors.email}
        onChange={(event) => setValues({ ...values, email: event.target.value })} onBlur={() => values.email && setErrors({ ...errors, email: validate().email })} />
      <div className="grid gap-1.5">
        <PasswordField label="Password" name="password" autoComplete="current-password" required value={values.password} error={errors.password}
          onChange={(event) => setValues({ ...values, password: event.target.value })} />
        <button type="button" className="sf-link justify-self-end text-[13px]" onClick={() => onForgot(values.email)}>Forgot password?</button>
      </div>
      <button className="sf-btn sf-btn-primary sf-btn-block" type="submit" disabled={isLoading}>{isLoading ? 'Signing in…' : 'Sign in'}</button>
      <p className="text-center text-sm text-[var(--sf-ink-soft)]">New to Bossco? <button type="button" className="sf-link" onClick={onRegister}>Create an account</button></p>
    </form>
  )
}

function RegisterForm({ next, onLogin }: { next: string; onLogin: () => void }) {
  const [signUp, { isLoading }] = useSignUpMutation()
  const [values, setValues] = useState({ first_name: '', last_name: '', email: '', phone: '', password: '', confirm: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const set = (field: keyof typeof values) => (event: React.ChangeEvent<HTMLInputElement>) => setValues({ ...values, [field]: event.target.value })
  const personal = [values.email, values.first_name, values.last_name]

  const validate = (): Errors => {
    const strength = checkPassword(values.password, personal)
    return {
      first_name: values.first_name.trim() ? undefined : 'Enter your first name',
      email: !values.email.trim() ? 'Enter your email address' : !isValidEmail(values.email) ? 'Enter a valid email address' : undefined,
      phone: values.phone && !/^[+\d][\d\s-]{6,16}$/.test(values.phone.trim()) ? 'Enter a valid phone number' : undefined,
      password: !values.password ? 'Create a password' : strength.acceptable ? undefined : strength.problems[0],
      confirm: values.confirm !== values.password ? 'Passwords don’t match' : undefined,
    }
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const found = validate()
    setErrors(found)
    setFormError(null)
    if (Object.values(found).some(Boolean)) return focusFirstError(formRef.current)
    try {
      const session = await signUp({
        first_name: values.first_name.trim(), last_name: values.last_name.trim(), email: values.email.trim(), phone: values.phone.trim(), password: values.password,
      }).unwrap()
      toast.success(`Welcome to Bossco, ${session.user?.firstName}! 🎉`, { description: 'Your account is ready.' })
      window.location.hash = next
    } catch (error) {
      const message = errorText(error)
      if (/already exists/i.test(message)) {
        setErrors({ email: 'An account with this email already exists.' })
        setFormError(null)
        focusFirstError(formRef.current)
      } else setFormError(message)
    }
  }

  return (
    <form ref={formRef} className="grid gap-5" onSubmit={submit} noValidate>
      <FormAlert message={formError} />
      {errors.email === 'An account with this email already exists.' && (
        <p className="sf-alert sf-alert-info text-[13px]">Already registered? <button type="button" className="sf-link" onClick={onLogin}>Sign in instead</button></p>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="First name" name="first_name" autoComplete="given-name" required value={values.first_name} error={errors.first_name} onChange={set('first_name')} />
        <TextField label="Last name" name="last_name" autoComplete="family-name" optional value={values.last_name} onChange={set('last_name')} />
      </div>
      <TextField label="Email" type="email" name="email" autoComplete="email" inputMode="email" required value={values.email} error={errors.email} onChange={set('email')}
        onBlur={() => values.email && setErrors({ ...errors, email: validate().email })} hint="We’ll send order updates and invoices here." />
      <TextField label="Mobile number" type="tel" name="phone" autoComplete="tel" optional value={values.phone} error={errors.phone} onChange={set('phone')} />
      <PasswordField label="Password" name="password" autoComplete="new-password" required value={values.password} error={errors.password} onChange={set('password')} showStrength personal={personal} />
      <PasswordField label="Confirm password" name="confirm_password" autoComplete="new-password" required value={values.confirm} error={errors.confirm} onChange={set('confirm')}
        onBlur={() => values.confirm && setErrors({ ...errors, confirm: validate().confirm })} />
      <button className="sf-btn sf-btn-primary sf-btn-block" type="submit" disabled={isLoading}>{isLoading ? 'Creating account…' : 'Create account'}</button>
      <p className="text-center text-sm text-[var(--sf-ink-soft)]">Already have an account? <button type="button" className="sf-link" onClick={onLogin}>Sign in</button></p>
    </form>
  )
}

function ForgotForm({ initialEmail, onBack }: { initialEmail: string; onBack: () => void }) {
  const [forgotPassword, { isLoading, data: sent }] = useForgotPasswordMutation()
  const [email, setEmail] = useState(initialEmail)
  const [error, setError] = useState<string>()
  const [formError, setFormError] = useState<string | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const problem = !email.trim() ? 'Enter your email address' : !isValidEmail(email) ? 'Enter a valid email address' : undefined
    setError(problem)
    setFormError(null)
    if (problem) return
    try {
      await forgotPassword({ email: email.trim() }).unwrap()
    } catch (failure) {
      setFormError(errorText(failure))
    }
  }

  if (sent) {
    return (
      <div className="grid gap-5 text-center" role="status">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-[var(--sf-success-bg)] text-[var(--sf-success)]"><MailCheck size={26} /></span>
        <p className="text-sm leading-6 text-[var(--sf-ink-soft)]">{sent.message}</p>
        <p className="sf-hint">The link expires after a while. Didn’t get it? Check spam, or try again in a few minutes.</p>
        <button type="button" className="sf-btn sf-btn-primary sf-btn-block" onClick={onBack}>Back to sign in</button>
      </div>
    )
  }
  return (
    <form className="grid gap-5" onSubmit={submit} noValidate>
      <FormAlert message={formError} />
      <TextField label="Email" type="email" name="email" autoComplete="email" inputMode="email" required value={email} error={error} onChange={(event) => setEmail(event.target.value)} autoFocus />
      <button className="sf-btn sf-btn-primary sf-btn-block" type="submit" disabled={isLoading}>{isLoading ? 'Sending…' : 'Email me a reset link'}</button>
      <button type="button" className="sf-btn sf-btn-ghost sf-btn-sm justify-self-center" onClick={onBack}><ArrowLeft size={14} /> Back to sign in</button>
    </form>
  )
}

export function AuthPage({ initialMode = 'login', next = '#account' }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [forgotEmail, setForgotEmail] = useState('')
  const titles: Record<AuthMode, [string, string]> = {
    login: ['Sign in', 'Welcome back. Sign in to see your orders, wishlist and saved addresses.'],
    register: ['Create your account', 'It takes less than a minute.'],
    forgot: ['Reset your password', 'Enter the email you registered with and we’ll send you a link to choose a new password.'],
  }
  return (
    <AuthLayout title={titles[mode][0]} subtitle={titles[mode][1]}>
      {mode !== 'forgot' && (
        <div className="mb-6 grid grid-cols-2 rounded-full bg-[var(--sf-surface-alt)] p-1 text-sm font-bold" role="tablist" aria-label="Account">
          {(['login', 'register'] as const).map((tab) => (
            <button key={tab} type="button" role="tab" aria-selected={mode === tab} onClick={() => setMode(tab)}
              className={`rounded-full py-2.5 transition ${mode === tab ? 'bg-[#173f32] text-white shadow' : 'text-[#315545] hover:text-[#173f32]'}`}>
              {tab === 'login' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>
      )}
      {mode === 'login' && <LoginForm next={next} onForgot={(email) => { setForgotEmail(email); setMode('forgot') }} onRegister={() => setMode('register')} />}
      {mode === 'register' && <RegisterForm next={next} onLogin={() => setMode('login')} />}
      {mode === 'forgot' && <ForgotForm initialEmail={forgotEmail} onBack={() => setMode('login')} />}
      {mode !== 'forgot' && <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-[var(--sf-muted)]"><CheckCircle2 size={13} /> We never share your details.</p>}
    </AuthLayout>
  )
}
