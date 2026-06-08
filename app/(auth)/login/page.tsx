import Link from 'next/link'
import LoginForm from './LoginForm'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  return (
    <>
      <h2 className="mb-6 text-center font-serif text-[21px] font-medium tracking-[-0.3px]">
        Welcome back
      </h2>

      {searchParams.error === 'confirm' && (
        <p className="mb-4 rounded-drawer bg-rust/10 px-3 py-2 text-sm text-rust">
          That confirmation link is invalid or has expired. Try logging in, or sign up again.
        </p>
      )}

      <LoginForm />

      <p className="mt-6 text-center text-sm text-ink-soft">
        New to FitSpace?{' '}
        <Link href="/signup" className="font-semibold text-rust hover:underline">
          Sign up
        </Link>
      </p>
    </>
  )
}
