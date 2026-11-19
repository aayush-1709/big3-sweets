import Link from 'next/link'
import { and, eq, inArray } from 'drizzle-orm'
import { headers } from 'next/headers'
import { ArrowLeft, LockKeyhole, MapPin } from 'lucide-react'
import { AuthForm } from '@/components/auth-form'
import { CheckoutButton } from '@/components/checkout-button'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { products } from '@/lib/db/schema'
import type { CheckoutLine } from '@/lib/checkout-types'

const money = (value: number) => `₹${value.toLocaleString('en-IN')}`
function readCart(value?: string): CheckoutLine[] {
  if (!value || value.length > 5000) return []
  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed) || parsed.length > 20) return []
    return parsed.filter((line): line is CheckoutLine => line && typeof line.productId === 'string' && ['half', 'full', 'piece'].includes(line.pack) && Number.isInteger(line.quantity) && line.quantity > 0 && line.quantity <= 20)
  } catch { return [] }
}

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ cart?: string }> }) {
  const { cart: cartValue } = await searchParams
  const cart = readCart(cartValue)
  if (!cart.length) return <main className="checkout-page"><div className="checkout-top"><Link href="/" className="admin-back"><ArrowLeft size={15} /> Back to the sweet shop</Link><span className="admin-label">BIG3 · SECURE CHECKOUT</span></div><section className="checkout-empty"><span className="checkout-seal"><LockKeyhole size={19} /></span><h1>Your bag is looking a little <em>light.</em></h1><p>Choose a sweet from our shop and it will be waiting here.</p><Link className="button button-dark" href="/#shop">Explore the mithai</Link></section></main>
  const session = await auth.api.getSession({ headers: await headers() })
  const normalized = new Map<string, CheckoutLine>()
  const perProduct = new Map<string, number>()
  for (const line of cart) {
    const key = `${line.productId}:${line.pack}`
    normalized.set(key, { ...line, quantity: (normalized.get(key)?.quantity ?? 0) + line.quantity })
    perProduct.set(line.productId, (perProduct.get(line.productId) ?? 0) + line.quantity)
  }
  if ([...perProduct.values()].some((qty) => qty > 20)) return <main className="checkout-page"><p className="checkout-alert">Please limit each sweet to 20 units per order.</p><Link href="/">Return to the shop</Link></main>
  const safeCart = [...normalized.values()]
  const encodedCart = encodeURIComponent(JSON.stringify(safeCart))
  if (!session?.user) return <main className="checkout-page"><div className="checkout-top"><Link href="/" className="admin-back"><ArrowLeft size={15} /> Sweet shop</Link><span className="admin-label">BIG3 · SECURE CHECKOUT</span></div><AuthForm mode="sign-in" returnTo={`/checkout?cart=${encodedCart}`} /></main>
  const ids = [...new Set(safeCart.map((line) => line.productId))]
  const catalog = await db.select().from(products).where(and(inArray(products.id, ids), eq(products.isAvailable, true)))
  if (catalog.length !== ids.length) return <main className="checkout-page"><div className="checkout-top"><Link href="/" className="admin-back"><ArrowLeft size={15} /> Sweet shop</Link></div><section className="checkout-empty"><h1>A sweet has sold out.</h1><p>Please head back to the shop and refresh your bag.</p><Link className="button button-dark" href="/#shop">Return to shop</Link></section></main>
  const priceKey = { half: 'priceHalfKg', full: 'priceFullKg', piece: 'pricePiece' } as const
  const stockKey = { half: 'stockHalfKg', full: 'stockFullKg', piece: 'stockPiece' } as const
  const lines = safeCart.map((line) => ({ ...line, product: catalog.find((product) => product.id === line.productId)! }))
  const subtotal = lines.reduce((sum, line) => sum + Number(line.product[priceKey[line.pack]] ?? 0) * line.quantity, 0)
  const unavailable = lines.some((line) => !line.product[priceKey[line.pack]] || line.product[stockKey[line.pack]] < line.quantity)
  return <main className="checkout-page"><div className="checkout-top"><Link href="/" className="admin-back"><ArrowLeft size={15} /> Sweet shop</Link><span className="admin-label">BIG3 · SECURE CHECKOUT</span></div><div className="checkout-layout"><section className="checkout-intro"><div className="eyebrow"><span className="eyebrow-line" /> ONE LAST LITTLE THING</div><h1>Almost <em>home.</em></h1><p>Your mithai is packed with care. Check your order, then continue to Stripe&apos;s secure payment page.</p><div className="checkout-place"><MapPin size={15} /><span>Made with love in Bihar<br /><small>Shipping details are collected securely at checkout</small></span></div><div className="checkout-security"><LockKeyhole size={15} /><span>Payments are securely processed by Stripe. Big3 never sees your card details.</span></div></section><section className="checkout-summary"><div className="checkout-summary-head"><h2>Your sweet box</h2><span>{lines.reduce((sum, line) => sum + line.quantity, 0)} items</span></div>{lines.map((line) => { const price = Number(line.product[priceKey[line.pack]] ?? 0); return <div className="checkout-line" key={`${line.product.id}-${line.pack}`}><span className="checkout-product-mark">✳</span><div className="checkout-line-copy"><strong>{line.product.name}</strong><small>{line.pack === 'half' ? '500 g' : line.pack === 'full' ? '1 kg' : 'Per piece'} · {line.product.origin} · Qty {line.quantity}</small></div><strong className="checkout-line-price">{money(price * line.quantity)}</strong></div> })}<div className="checkout-total"><span>Total · INR</span><strong>{money(subtotal)}</strong></div>{unavailable ? <p className="checkout-alert">A selected size is sold out or has changed. Return to the shop to update your bag.</p> : <CheckoutButton lines={safeCart} />}<Link className="checkout-edit" href="/#shop">Continue browsing</Link></section></div></main>
}
