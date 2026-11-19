'use client'

import { useRef, useState } from 'react'
import { ArrowRight, LockKeyhole } from 'lucide-react'
import { createCheckoutSession } from '@/app/checkout/actions'
import type { CheckoutLine } from '@/lib/checkout-types'

export function CheckoutButton({ lines }: { lines: CheckoutLine[] }) {
  const requestKey = useRef<string | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  async function beginCheckout() {
    if (pending) return
    setPending(true)
    setError('')
    requestKey.current ??= crypto.randomUUID()
    try {
      const result = await createCheckoutSession(lines, requestKey.current)
      if ('error' in result && result.error) { setError(result.error); setPending(false); return }
      if (result.url) window.location.assign(result.url)
      else { setError('Secure checkout could not be opened. Please try again.'); setPending(false) }
    } catch {
      setError('Secure checkout is temporarily unavailable. Please try again.')
      setPending(false)
    }
  }
  return <div className="checkout-action"><button className="button button-dark checkout-pay" disabled={pending} onClick={beginCheckout}>{pending ? 'Opening secure checkout…' : <>Pay securely with Stripe <ArrowRight size={15} /></>}</button><span className="checkout-lock"><LockKeyhole size={12} /> Secure payment</span>{error && <p className="checkout-alert" role="alert">{error}</p>}</div>
}
