import { toast } from 'sonner'
import type { FormEvent } from 'react'
import { useSubscribeNewsletterMutation } from '../../features/api/storeApi'
import leftNuts from '../../assets/images/ab48ed1fb8c87befc3434564f5ff773a6d764dac.webp'
const rightNuts = leftNuts // same artwork, rotated

export function NewsletterSection() {
  const [subscribe, { isLoading }] = useSubscribeNewsletterMutation()
  // bossco.newsletter.subscribe: double opt-in email on Frappe 15, direct subscription on 16
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formElement = event.currentTarget
    const email = String(new FormData(formElement).get('email') ?? '').trim()
    try {
      const result = await subscribe({ email }).unwrap()
      formElement.reset()
      toast.success(result.confirmed ? 'Subscribed! 🍯' : 'Almost there! 📩', { description: result.message })
    } catch (error) {
      toast.error('Could not subscribe', { description: typeof error === 'string' ? error : 'Please try again.' })
    }
  }
  return (
    <section className="bg-white px-5 py-20 dark:bg-stone-950 sm:px-8" id="newsletter">
      <div className="newsletter-card relative mx-auto flex min-h-[345px] max-w-[1180px] items-center justify-center overflow-hidden rounded-[32px] bg-[#d9aa70] px-5 py-12 text-center shadow-[0_28px_70px_rgba(102,62,21,.16)] sm:px-6 sm:py-14" data-reveal>
        <div className="absolute inset-3 rounded-[24px] border border-white/25" />
        <img
          className="pointer-events-none absolute -bottom-20 -left-12 w-[180px] select-none opacity-80 sm:-bottom-52 sm:-left-28 sm:w-[430px] sm:opacity-100"
          src={leftNuts}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
        />
        <img
          className="pointer-events-none absolute -right-12 -top-20 w-[180px] rotate-180 select-none opacity-80 sm:-right-28 sm:-top-52 sm:w-[430px] sm:opacity-100"
          src={rightNuts}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
        />

        <div className="relative z-10 w-full max-w-[800px]">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[.2em] text-white/80">Join the wholesome side</p>
          <h2 className="font-display text-[clamp(2rem,7.4vw,4.2rem)] font-bold leading-[0.9] tracking-[-0.04em] text-[#173f32]">
            <span className="block">Fresh drops &amp;</span>
            <span className="block italic text-white">tasty little secrets.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm text-white/85">Get first bites of new launches, seasonal bundles and members-only offers.</p>
          <form
            className="mx-auto mt-7 flex max-w-[560px] flex-col gap-3 sm:flex-row"
            onSubmit={submit}
          >
            <label className="sr-only" htmlFor="newsletter-email">
              Email address
            </label>
            <input
              className="h-12 min-w-0 flex-1 rounded-full border border-white/60 bg-white/15 px-6 text-sm text-white outline-none backdrop-blur-sm placeholder:text-white focus:border-white focus:ring-2 focus:ring-white/30"
              id="newsletter-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email address"
              required
            />
            <button
              className="h-12 rounded-full bg-white px-8 text-sm font-semibold text-[#d39a60] shadow-md transition hover:-translate-y-0.5 hover:bg-stone-50"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Subscribing…' : 'Subscribe'}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
