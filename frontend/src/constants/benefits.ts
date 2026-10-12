import deliveryIcon from '../assets/images/svg.webp'
import returnIcon from '../assets/images/Frame.webp'
import organicIcon from '../assets/images/Frame (1).webp'
import supportIcon from '../assets/images/Frame (2).webp'

export const benefits = [
  {
    title: 'Free Delivery',
    description: 'Orders from all items',
    icon: deliveryIcon,
  },
  {
    title: 'Return & Refund',
    description: 'Money-back guarantee',
    icon: returnIcon,
  },
  {
    title: 'Pure Organic',
    description: '100% Natural',
    icon: organicIcon,
  },
  {
    title: 'Support 24/7',
    description: 'Contact us 24 hours a day',
    icon: supportIcon,
  },
] as const
