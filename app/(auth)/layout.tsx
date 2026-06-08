export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 py-12">
      <h1 className="mb-8 font-serif text-[34px] font-medium tracking-[-0.5px]">FitSpace</h1>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}
