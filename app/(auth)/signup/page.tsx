import Link from 'next/link'
import SignupForm from './SignupForm'

export default function SignupPage() {
  return (
    <>
      <h2 className="mb-6 text-center font-serif text-[21px] font-medium tracking-[-0.3px]">
        Share your fits, build your wardrobe
      </h2>

      <SignupForm />

      <p className="mt-6 text-center text-sm text-ink-soft">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-rust hover:underline">
          Log in
        </Link>
      </p>
    </>
  )
}
