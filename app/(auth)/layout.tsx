export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">FitSpace</h1>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}
