import { HeartPulse, Leaf, ShieldCheck, Zap } from 'lucide-react'
import type { Feature } from '../types/feature'

export const leftHoneyBenefits: Feature[] = [
  {
    title: 'Rich in Antioxidants',
    description: 'Naturally occurring compounds that help support everyday cellular wellness.',
    icon: ShieldCheck,
  },
  {
    title: 'Natural Sweetener',
    description: 'A beautifully balanced sweetness with nothing artificial added.',
    icon: Leaf,
  },
]

export const rightHoneyBenefits: Feature[] = [
  {
    title: 'Energy Booster',
    description: 'Quick, honest energy for active mornings and mid-day resets.',
    icon: Zap,
  },
  {
    title: 'Supports Immunity',
    description: 'A comforting pantry ritual traditionally loved through every season.',
    icon: HeartPulse,
  },
]
