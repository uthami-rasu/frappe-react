import { toast } from 'sonner'
import { ArrowLeft, LockKeyhole, Mail } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { NutDecorations } from '../components/home/NutDecorations'
import { useForgotPasswordMutation, useLoginMutation, useSignUpMutation } from '../features/api/storeApi'

type AuthMode = 'login' | 'register' | 'forgot'

type AuthPageProps = {
  initialMode?: AuthMode
  // hash route to open after signing in, e.g. '#checkout'
  next?: string
}

const labelClass = 'block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1'
const submitClass = 'w-full rounded-lg bg-[#173f32] py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#1e5040] disabled:cursor-wait disabled:opacity-70'

function fieldsOf(event: FormEvent<HTMLFormElement>) {
  const form = new FormData(event.currentTarget)
  return (name: string) => String(form.get(name) ?? '').trim()
}

const errorText = (error: unknown) => (typeof error === 'string' ? error : 'Please check your connection and try again.')

export function AuthPage({ initialMode = 'login', next = '#account' }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [login, { isLoading: isLoggingIn }] = useLoginMutation()
  const [signUp, { isLoading: isSigningUp }] = useSignUpMutation()
  const [forgotPassword, { isLoading: isSending, data: resetSent }] = useForgotPasswordMutation()

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const field = fieldsOf(event)
    try {
      const session = await login({ email: field('email'), password: String(new FormData(event.currentTarget).get('password')) }).unwrap()
      toast.success(`Welcome back, ${session.user?.firstName || 'friend'}!`)
      window.location.hash = next
    } catch (error) {
      toast.error('Could not sign in', { description: errorText(error) })
    }
  }

  const handleSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const field = fieldsOf(event)
    const form = new FormData(event.currentTarget)
    const password = String(form.get('password'))
    if (password !== String(form.get('confirm_password'))) {
      toast.error('Passwords do not match')
      return
    }
    try {
      const session = await signUp({
        first_name: field('first_name'), last_name: field('last_name'), email: field('email'), phone: field('phone'), password,
      }).unwrap()
      toast.success(`Welcome to Bossco, ${session.user?.firstName}! 🎉`, { description: 'Your account is ready.' })
      window.location.hash = next
    } catch (error) {
      toast.error('Could not create your account', { description: errorText(error) })
    }
  }

  const handleForgot = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      await forgotPassword({ email: fieldsOf(event)('email') }).unwrap()
    } catch (error) {
      toast.error('Could not send the reset link', { description: errorText(error) })
    }
  }

  return (
    <main className="commerce-page relative overflow-hidden">
      <NutDecorations />
      <div className="commerce-wrap relative z-10">
        <h1>{mode === 'register' ? 'Create Account' : mode === 'forgot' ? 'Reset Password' : 'Sign In'}</h1>
        <section className="mx-auto mt-10 max-w-[460px] rounded-2xl border border-[#e2ded5] bg-white/90 p-6 shadow-lg backdrop-blur-sm sm:p-8">
          {mode !== 'forgot' && (
            <div className="mb-7 grid grid-cols-2 rounded-full bg-[#f4efe5] p-1 text-sm font-bold" role="tablist">
              {(['login', 'register'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={mode === tab}
                  onClick={() => setMode(tab)}
                  className={`rounded-full py-2.5 transition ${mode === tab ? 'bg-[#173f32] text-white shadow' : 'text-[#315545] hover:text-[#173f32]'}`}
                >
                  {tab === 'login' ? 'Sign in' : 'Create account'}
                </button>
              ))}
            </div>
          )}

          {mode === 'login' && (
            <form className="space-y-5" onSubmit={handleLogin}>
              <div>
                <label className={labelClass} htmlFor="login-email">Email</label>
                <input id="login-email" name="email" type="email" required autoComplete="email" className="account-input" placeholder="you@example.com" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className={labelClass} htmlFor="login-password">Password</label>
                  <button type="button" className="mb-1 text-xs font-semibold text-[#a36932] hover:underline" onClick={() => setMode('forgot')}>Forgot password?</button>
                </div>
                <input id="login-password" name="password" type="password" required autoComplete="current-password" className="account-input" placeholder="Your password" />
              </div>
              <button className={submitClass} type="submit" disabled={isLoggingIn}>{isLoggingIn ? 'Signing in…' : 'Sign in'}</button>
            </form>
          )}

          {mode === 'register' && (
            <form className="space-y-5" onSubmit={handleSignUp}>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="signup-first">First name *</label>
                  <input id="signup-first" name="first_name" required autoComplete="given-name" className="account-input" placeholder="First name" />
                </div>
                <div>
                  <label className={labelClass} htmlFor="signup-last">Last name</label>
                  <input id="signup-last" name="last_name" autoComplete="family-name" className="account-input" placeholder="Last name" />
                </div>
              </div>
              <div>
                <label className={labelClass} htmlFor="signup-email">Email *</label>
                <input id="signup-email" name="email" type="email" required autoComplete="email" className="account-input" placeholder="you@example.com" />
              </div>
              <div>
                <label className={labelClass} htmlFor="signup-phone">Phone</label>
                <input id="signup-phone" name="phone" type="tel" autoComplete="tel" className="account-input" placeholder="Mobile number" />
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="signup-password">Password *</label>
                  <input id="signup-password" name="password" type="password" required minLength={8} autoComplete="new-password" className="account-input" placeholder="8+ characters" />
                </div>
                <div>
                  <label className={labelClass} htmlFor="signup-confirm">Confirm *</label>
                  <input id="signup-confirm" name="confirm_password" type="password" required minLength={8} autoComplete="new-password" className="account-input" placeholder="Repeat password" />
                </div>
              </div>
              <p className="text-xs text-stone-500">Use a mix of words, numbers and symbols — very common passwords are rejected.</p>
              <button className={submitClass} type="submit" disabled={isSigningUp}>{isSigningUp ? 'Creating account…' : 'Create account'}</button>
            </form>
          )}

          {mode === 'forgot' && (
            resetSent ? (
              <div className="space-y-5 text-center">
                <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#eef3ea] text-[#527d49]"><Mail size={24} /></span>
                <p className="text-sm leading-6 text-stone-600">{resetSent.message}</p>
                <button type="button" className={submitClass} onClick={() => setMode('login')}>Back to sign in</button>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleForgot}>
                <p className="flex items-start gap-3 text-sm leading-6 text-stone-600"><LockKeyhole className="mt-1 shrink-0 text-[#a36932]" size={16} /> Enter your account email and we'll send you a link to set a new password.</p>
                <div>
                  <label className={labelClass} htmlFor="forgot-email">Email</label>
                  <input id="forgot-email" name="email" type="email" required autoComplete="email" className="account-input" placeholder="you@example.com" />
                </div>
                <button className={submitClass} type="submit" disabled={isSending}>{isSending ? 'Sending…' : 'Send reset link'}</button>
                <button type="button" className="flex w-full items-center justify-center gap-2 text-xs font-semibold text-[#315545] hover:underline" onClick={() => setMode('login')}><ArrowLeft size={13} /> Back to sign in</button>
              </form>
            )
          )}
        </section>
      </div>
      <div className="commerce-bottom-bar" />
    </main>
  )
}
