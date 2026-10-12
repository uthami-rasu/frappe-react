import rachael from '../assets/images/3643cd47ed1eb60c328f1aabe67ad92a386e6f21.webp'
import ethan from '../assets/images/6f0d8e0385a9f1d6d99df21b7ec265bb036bce78.webp'
import noah from '../assets/images/755e7cc0cb09083f54661dd5580a9393cfa08075.webp'
import mia from '../assets/images/76ddd607ef4015c5bed223380433fd166c0e6a16.webp'
import liam from '../assets/images/cf71623d3c794b9bc9156dd5a34300475741ccf1.webp'
import type { Testimonial } from '../types/testimonial'

const defaultQuote =
  'The quality is exceptional and every product tastes incredibly fresh. Bossco has become a trusted part of our everyday healthy routine.'

export const testimonials: Testimonial[] = [
  { id: 1, name: 'Rachael Schumm', image: rachael, quote: defaultQuote },
  { id: 2, name: 'Noah Miller', image: noah, quote: defaultQuote },
  { id: 3, name: 'Ethan Lewis', image: ethan, quote: defaultQuote },
  { id: 4, name: 'Mia Carter', image: mia, quote: defaultQuote },
  { id: 5, name: 'Liam Wilson', image: liam, quote: defaultQuote },
]
