import Link from 'next/link'
import SignupForm from './SignupForm'

export default function SignupPage() {
  return (
    <>
      <h2 className="mb-6 text-center text-lg font-semibold">
        Share your fits, build your wardrobe
      </h2>

      <SignupForm />

      <p className="mt-6 text-center text-sm text-neutral-500">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-black hover:underline">
          Log in
        </Link>
      </p>
    </>
  )
}
