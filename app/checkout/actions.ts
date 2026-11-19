'use server'

import { createHash } from 'node:crypto'
import type Stripe from 'stripe'
import { and, eq, inArray } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { marketplaceOrders, products } from '@/lib/db/schema'
import { stripe } from '@/lib/stripe'

type Pack = 'half' | 'full' | 'piece'
type CheckoutLine = { productId: string; pack: Pack; quantity: number }
const variants: Record<Pack, { price: 'priceHalfKg' | 'priceFullKg' | 'pricePiece'; stock: 'stockHalfKg' | 'stockFullKg' | 'stockPiece'; label: string }> = {
  half: { price: 'priceHalfKg', stock: 'stockHalfKg', label: '500 g' },
  full: { price: 'priceFullKg', stock: 'stockFullKg', label: '1 kg' },
  piece: { price: 'pricePiece', stock: 'stockPiece', label: 'per piece' },
}

export async function createCheckoutSession(input: CheckoutLine[], requestKey: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return { error: 'Sign in to continue with your order.' }
  if (!Array.isArray(input) || input.length < 1 || input.length > 20 || !/^[0-9a-f-]{36}$/i.test(requestKey)) return { error: 'Your bag could not be checked. Please review it and try again.' }

  const quantities = new Map<string, number>()
  const normalized = new Map<string, CheckoutLine>()
  for (const line of input) {
    if (!line || typeof line.productId !== 'string' || !['half', 'full', 'piece'].includes(line.pack) || !Number.isInteger(line.quantity) || line.quantity <= 0) return { error: 'One or more items in your bag are invalid.' }
    const key = `${line.productId}:${line.pack}`
    const next = (normalized.get(key)?.quantity ?? 0) + line.quantity
    normalized.set(key, { ...line, quantity: next })
    quantities.set(line.productId, (quantities.get(line.productId) ?? 0) + line.quantity)
    if (quantities.get(line.productId)! > 20) return { error: 'You can order up to 20 units of each sweet in one checkout.' }
  }

  const lines = [...normalized.values()]
  const productIds = [...new Set(lines.map((line) => line.productId))]
  const catalog = await db.select().from(products).where(inArray(products.id, productIds))
  if (catalog.length !== productIds.length || catalog.some((product) => !product.isAvailable)) return { error: 'A sweet in your bag is no longer available.' }

  let totalPaise = 0
  const stripeLineItems: Array<Stripe.Checkout.SessionCreateParams.LineItem> = []
  const savedItems: Array<{ productId: string; pack: Pack; quantity: number }> = []
  for (const line of lines) {
    const product = catalog.find((entry) => entry.id === line.productId)!
    const variant = variants[line.pack]
    const unitRupees = product[variant.price]
    const available = product[variant.stock]
    if (unitRupees === null || available < line.quantity) return { error: `${product.name} does not have enough stock in the selected size.` }
    const unitAmount = unitRupees * 100
    totalPaise += unitAmount * line.quantity
    stripeLineItems.push({ price_data: { currency: 'inr', product_data: { name: `${product.name} · ${variant.label}`, description: product.origin }, unit_amount: unitAmount }, quantity: line.quantity })
    savedItems.push({ productId: product.id, pack: line.pack, quantity: line.quantity })
  }
  if (totalPaise <= 0 || totalPaise > 100000000) return { error: 'Your order total is outside the supported range.' }

  const origin = process.env.BETTER_AUTH_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : process.env.V0_RUNTIME_URL ?? 'http://localhost:3000')
  const cart = encodeURIComponent(JSON.stringify(savedItems))
  try {
    const checkout = await stripe.checkout.sessions.create({
      mode: 'payment', ui_mode: 'hosted_page',
      shipping_address_collection: { allowed_countries: ['IN'] },
      line_items: stripeLineItems,
      customer_email: session.user.email,
      client_reference_id: session.user.id,
      metadata: { userId: session.user.id },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout?cart=${cart}`,
    }, { idempotencyKey: `big3-${createHash('sha256').update(`${session.user.id}:${requestKey}`).digest('hex')}` })
    if (!checkout.url) return { error: 'Secure checkout could not be opened. Please try again.' }
    await db.insert(marketplaceOrders).values({ id: crypto.randomUUID(), userId: session.user.id, stripeSessionId: checkout.id, status: 'pending', amountPaise: totalPaise, currency: 'inr', items: savedItems }).onConflictDoNothing()
    return { url: checkout.url }
  } catch {
    return { error: 'Secure checkout is temporarily unavailable. Please try again.' }
  }
}

export async function completePaidOrder(sessionId: string) {
  const current = await auth.api.getSession({ headers: await headers() })
  if (!current?.user || !/^cs_(test|live)_[a-zA-Z0-9]+$/.test(sessionId)) return { status: 'unavailable' as const }
  let stripeSession: Stripe.Checkout.Session
  try {
    stripeSession = await stripe.checkout.sessions.retrieve(sessionId)
  } catch {
    return { status: 'unavailable' as const }
  }
  if (stripeSession.payment_status !== 'paid' || stripeSession.client_reference_id !== current.user.id || stripeSession.currency !== 'inr') return { status: 'unavailable' as const }

  return db.transaction(async (tx) => {
    const [order] = await tx.select().from(marketplaceOrders).where(and(eq(marketplaceOrders.stripeSessionId, sessionId), eq(marketplaceOrders.userId, current.user.id))).for('update')
    if (!order || stripeSession.amount_total !== order.amountPaise) return { status: 'unavailable' as const }
    if (order.status === 'paid') return { status: 'complete' as const, amountPaise: order.amountPaise }
    const orderItems = order.items as Array<{ productId: string; pack: Pack; quantity: number }>
    const ids = [...new Set(orderItems.map((item) => item.productId))]
    const lockedProducts = await tx.select().from(products).where(inArray(products.id, ids)).for('update')
    for (const item of orderItems) {
      const product = lockedProducts.find((entry) => entry.id === item.productId)
      if (!product || product[variants[item.pack].stock] < item.quantity) return { status: 'stock-issue' as const }
    }
    for (const item of orderItems) {
      const column = variants[item.pack].stock
      const product = lockedProducts.find((entry) => entry.id === item.productId)!
      await tx.update(products).set({ [column]: product[column] - item.quantity, updatedAt: new Date() }).where(eq(products.id, item.productId))
    }
    await tx.update(marketplaceOrders).set({ status: 'paid', updatedAt: new Date() }).where(eq(marketplaceOrders.id, order.id))
    return { status: 'complete' as const, amountPaise: order.amountPaise }
  })
}
