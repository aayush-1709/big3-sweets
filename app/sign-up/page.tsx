import { AuthForm } from '@/components/auth-form'

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const { returnTo } = await searchParams
  return <AuthForm mode="sign-up" returnTo={returnTo} />
}
