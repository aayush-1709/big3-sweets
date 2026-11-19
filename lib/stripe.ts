import 'server-only'

import Stripe from 'stripe'

const secretKey = process.env.STRIPE_SECRET_KEY
if (!secretKey) throw new Error('Stripe is not configured for this project.')

export const stripe = new Stripe(secretKey)
