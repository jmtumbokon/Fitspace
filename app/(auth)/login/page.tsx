import Link from 'next/link'
import LoginForm from './LoginForm'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  return (
    <>
      <h2 className="mb-6 text-center text-lg font-semibold">Welcome back</h2>

      {searchParams.error === 'confirm' && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          That confirmation link is invalid or has expired. Try logging in, or sign up again.
        </p>
      )}

      <LoginForm />

      <p className="mt-6 text-center text-sm text-neutral-500">
        New to FitSpace?{' '}
        <Link href="/signup" className="font-semibold text-black hover:underline">
          Sign up
        </Link>
      </p>
    </>
  )
}
