import Link from 'next/link'
import { Check, Heart, PackageCheck } from 'lucide-react'
import { completePaidOrder } from '@/app/checkout/actions'

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id: sessionId } = await searchParams
  const result = sessionId ? await completePaidOrder(sessionId) : { status: 'unavailable' as const }
  if (result.status === 'complete') return <main className="checkout-page"><div className="checkout-top"><Link href="/" className="brand"><span className="brand-mark">B<span>3</span></span><span className="brand-name">big3<span>sweets</span></span></Link><span className="admin-label">BIG3 · ORDER CONFIRMED</span></div><section className="success-card"><span className="success-seal"><Check size={23} /></span><span className="auth-kicker">SWEETNESS IS ON ITS WAY</span><h1>Thank you for<br /><em>sharing a little Bihar.</em></h1><p>Your payment of <strong>₹{Math.floor(result.amountPaise / 100).toLocaleString('en-IN')}</strong> was successful. Your sweets will be packed with care.</p><div className="success-note"><PackageCheck size={17} /><span>We&apos;re preparing your order<br /><small>Made fresh, packed with love.</small></span></div><Link className="button button-dark" href="/#shop">Back to the sweet shop <Heart size={14} /></Link></section></main>
  return <main className="checkout-page"><div className="checkout-top"><Link href="/" className="admin-back">← Back to the sweet shop</Link><span className="admin-label">BIG3 · PAYMENT STATUS</span></div><section className="checkout-empty"><span className="checkout-seal"><PackageCheck size={20} /></span><h1>We&apos;re checking on your <em>order.</em></h1><p>If your payment went through, please keep this page open for a moment or contact us with your Stripe receipt. Your inventory has not been marked as fulfilled.</p><Link className="button button-dark" href="/">Return to the shop</Link></section></main>
}
