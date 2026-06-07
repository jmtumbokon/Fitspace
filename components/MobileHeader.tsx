import NotificationBell from './NotificationBell'

// Mobile-only sticky wordmark header shared by the closet views; desktop
// has the sidebar brand (and its own bell).

export default function MobileHeader() {
  return (
    <header className="sticky top-0 z-40 -mx-5 flex items-center justify-between border-b border-line bg-bg/85 px-5 py-2.5 backdrop-blur-[14px] md:hidden">
      <h1 className="font-serif text-[23px] font-medium tracking-[-0.4px]">FitSpace</h1>
      <NotificationBell />
    </header>
  )
}
