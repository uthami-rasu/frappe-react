import { toast } from 'sonner'
import { useState } from 'react'
import { Check, Globe2, Mail, MapPin, MessageCircle, Phone, Send } from 'lucide-react'
import { Footer } from '../components/layout/Footer'
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from '../components/ui/SocialIcons'

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false)
  return (
    <main className="contact-page">
      <section className="contact-hero">
        <div className="contact-hero-image" aria-hidden="true" />
        <div className="contact-hero-content">
          <nav aria-label="Breadcrumb"><a href="#home">Home</a><span>/</span><b>Contact</b></nav>
          <span className="contact-eyebrow"><MessageCircle size={14} /> We’re listening</span>
          <h1>Contact Us</h1>
          <p>We’re here to help. Reach out with your questions, orders or business enquiries.</p>
          <div><a href="tel:+918807783007"><Phone size={13} /> Call now</a><a href="https://wa.me/918807783007" target="_blank" rel="noreferrer"><WhatsAppIcon size={14} /> WhatsApp</a></div>
        </div>
      </section>

      <div className="contact-shell">
        <form className="contact-form" onSubmit={(event) => {
          event.preventDefault()
          setSubmitted(true)
          toast.success('Message sent successfully!', { description: 'Thank you! We usually reply within one business day.' })
        }}>
          <div className="contact-form-heading"><div><span>Send a note</span><h2>How can we help?</h2></div><Mail size={25} /></div>
          <div className="contact-form-layout">
            <aside className="contact-form-aside">
              <span className="contact-aside-icon"><MessageCircle size={20} /></span>
              <p>Personal support</p>
              <h3>Let’s start a good conversation.</h3>
              <p>Whether it’s an order, a gifting idea or a wholesale partnership, our team will point you in the right direction.</p>
              <div className="contact-promises"><span><Check size={13} /> Usually replies within one business day</span><span><Check size={13} /> Helpful humans, never automated scripts</span><span><Check size={13} /> Secure and private communication</span></div>
              <a href="tel:+918807783007"><Phone size={15} /><span><small>Prefer to talk?</small><b>+91 88077 83007</b></span></a>
            </aside>
            <div className="contact-form-fields">
              <div className="contact-form-grid">
                <label>Full name<input required placeholder="John Doe" /></label>
                <label>Email address<input required type="email" placeholder="john@example.com" /></label>
                <label>Phone number<input required type="tel" placeholder="+91 98765 43210" /></label>
                <label>Order number <small>Optional</small><input placeholder="#BSC-12345" /></label>
                <label className="contact-span-2">Subject<select defaultValue="Product enquiry"><option>Product enquiry</option><option>Order support</option><option>Wholesale enquiry</option><option>Gifting and hampers</option><option>Something else</option></select></label>
                <label className="contact-span-2">Message<textarea required placeholder="How can we help you?" /></label>
              </div>
              <label className="contact-consent"><input required type="checkbox" /> <span>I agree to the Privacy Policy and terms of service regarding data handling.</span></label>
              <button className={submitted ? 'is-submitted' : ''} type="submit">{submitted ? <><Check size={16} /> Message sent successfully</> : <><Send size={15} /> Send message</>}</button>
            </div>
          </div>
        </form>

        <section className="contact-cards" aria-label="Contact information">
          <article><div className="contact-card-top"><span><Mail size={21} /></span><small>Direct lines</small></div><h2>Talk to our team</h2><p>Questions about a jar or an existing order? We’re ready to help.</p><div className="contact-card-links"><a href="mailto:hello@bossco.com"><Mail size={13} /> hello@bossco.com</a><a href="tel:+918807783007"><Phone size={13} /> +91 88077 83007</a></div><b className="contact-status"><i /> Online today</b></article>
          <article><div className="contact-card-top"><span><MapPin size={21} /></span><small>Our home</small></div><h2>Visit Bossco</h2><address>5D/12B Pasuvanthanal Road<br />Kovilpatti, Tamil Nadu<br />628501, India</address><a className="contact-card-direction" href="https://www.google.com/maps/search/?api=1&amp;query=Kovilpatti%2C%20Tamil%20Nadu%20628501" target="_blank" rel="noreferrer">Open directions <Send size={12} /></a></article>
          <article><div className="contact-card-top"><span><Globe2 size={21} /></span><small>Stay connected</small></div><h2>Follow the harvest</h2><p>New launches, serving ideas and glimpses from behind the scenes.</p><div className="contact-socials"><a href="https://wa.me/918807783007" aria-label="WhatsApp"><WhatsAppIcon size={18} /></a><a href="https://instagram.com" aria-label="Instagram"><InstagramIcon size={18} /></a><a href="https://facebook.com" aria-label="Facebook"><FacebookIcon size={18} /></a></div><b className="contact-social-label">@bossconaturals</b></article>
        </section>

        <section className="contact-location-section">
          <header><div><span><MapPin size={14} /> Find us</span><h2>Come say hello in Kovilpatti.</h2></div><p>We’d love to welcome you. Call ahead if you’re visiting for a specific product or wholesale conversation.</p></header>
          <div className="contact-map"><iframe title="Bossco location in Kovilpatti" src="https://www.openstreetmap.org/export/embed.html?bbox=77.82%2C9.12%2C77.91%2C9.22&amp;layer=mapnik&amp;marker=9.1674%2C77.8767" loading="lazy" /><aside className="map-details"><span className="map-pin"><MapPin size={20} /></span><small>Bossco Naturals</small><h3>Kovilpatti store</h3><address>5D/12B Pasuvanthanal Road<br />Kovilpatti, Tamil Nadu 628501</address><dl><div><dt>Mon – Sat</dt><dd>9:30 AM – 7:00 PM</dd></div><div><dt>Sunday</dt><dd>By appointment</dd></div></dl><a href="https://www.google.com/maps/search/?api=1&amp;query=Kovilpatti%2C%20Tamil%20Nadu%20628501" target="_blank" rel="noreferrer">Get directions <Send size={13} /></a></aside></div>
        </section>
      </div>
      <Footer />
    </main>
  )
}
