import { AuthForm } from '@/components/auth-form'

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const { returnTo } = await searchParams
  return <AuthForm mode="sign-in" returnTo={returnTo} />
}
