'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { authClient } from '@/lib/auth-client'

export function AuthForm({ mode, returnTo = '/' }: { mode: 'sign-in' | 'sign-up'; returnTo?: string }) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const isSignup = mode === 'sign-up'
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setPending(true)
    const values = Object.fromEntries(new FormData(event.currentTarget))
    const result = isSignup
      ? await authClient.signUp.email({ name: String(values.name), email: String(values.email), password: String(values.password) })
      : await authClient.signIn.email({ email: String(values.email), password: String(values.password) })
    setPending(false)
    if (result.error) { setError('We couldn’t sign you in with those details. Please try again.'); return }
    const safeReturnTo = returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/'
    router.push(safeReturnTo); router.refresh()
  }
  return <main className="auth-page"><Link className="brand auth-brand" href="/"><span className="brand-mark">B<span>3</span></span><span className="brand-name">big3<span>sweets</span></span></Link><section className="auth-card"><span className="auth-kicker">A LITTLE TASTE OF HOME</span><h1>{isSignup ? 'Come on in.' : 'Welcome back.'}</h1><p>{isSignup ? 'Let’s save your favourites and make room for mithai.' : 'Your next favourite is just around the corner.'}</p><form onSubmit={handleSubmit}>{isSignup && <label>Your name<input name="name" required autoComplete="name" placeholder="e.g. Ananya Kumar" /></label>}<label>Email address<input name="email" type="email" required autoComplete="email" placeholder="you@example.com" /></label><label>Password<input name="password" type="password" required minLength={8} autoComplete={isSignup ? 'new-password' : 'current-password'} placeholder="At least 8 characters" /></label>{error && <p className="auth-error" role="alert">{error}</p>}<button className="button button-dark auth-submit" disabled={pending}>{pending ? 'One moment…' : isSignup ? 'Create your account' : 'Sign in'}</button></form><div className="auth-divider"><span /> OR <span /></div><p className="auth-switch">{isSignup ? 'Already have an account?' : 'New to Big3?'} <Link href={`${isSignup ? '/sign-in' : '/sign-up'}?returnTo=${encodeURIComponent(returnTo)}`}>{isSignup ? 'Sign in' : 'Create an account'}</Link></p><Link className="auth-back" href="/">← Back to the sweet shop</Link></section><div className="auth-note">A little piece of Bihar, wherever you call home.</div></main>
}
