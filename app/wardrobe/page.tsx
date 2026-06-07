import { redirect } from 'next/navigation'
import MobileHeader from '@/components/MobileHeader'
import StatCard from '@/components/StatCard'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import type { WardrobeItem } from '@/types'
import WardrobeView from './WardrobeView'

export default async function WardrobePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // RLS already scopes wardrobe_items to the current user
  const { data } = await supabase
    .from('wardrobe_items')
    .select('*')
    .order('created_at', { ascending: false })

  const items = (data ?? []) as unknown as WardrobeItem[]
  const owned = items.filter((item) => !item.is_wishlist)

  // Stats row: total items, total value, most-worn piece, avg cost-per-wear
  const totalValue = owned.reduce((sum, item) => sum + (item.purchase_price ?? 0), 0)
  const mostWorn = owned.reduce<WardrobeItem | null>(
    (best, item) =>
      item.times_worn > 0 && item.times_worn > (best?.times_worn ?? 0) ? item : best,
    null
  )
  const wornValue = owned
    .filter((item) => item.purchase_price != null && item.times_worn > 0)
    .reduce(
      (acc, item) => ({
        cost: acc.cost + item.purchase_price!,
        wears: acc.wears + item.times_worn,
      }),
      { cost: 0, wears: 0 }
    )
  const avgCostPerWear = wornValue.wears > 0 ? wornValue.cost / wornValue.wears : null

  return (
    <div className="mx-auto max-w-[1240px] px-5 pb-20 md:px-10">
      <MobileHeader />

      {/* View head */}
      <div className="mb-7 border-b border-line pb-4 pt-7">
        <h2 className="font-serif text-[27px] font-medium tracking-[-0.4px]">My closet</h2>
        <p className="mt-[3px] text-[13.5px] text-ink-soft">
          {owned.length} {owned.length === 1 ? 'piece' : 'pieces'} · open a drawer to browse
        </p>
      </div>

      <div className="grid gap-[26px] md:grid-cols-[260px_1fr]">
        {/* Stats column */}
        <div className="grid grid-cols-2 gap-3 self-start md:flex md:flex-col">
          <StatCard value={owned.length} label="pieces owned" />
          <StatCard value={formatPrice(totalValue)} label="closet value" />
          <StatCard
            value={avgCostPerWear != null ? formatPrice(avgCostPerWear) : '—'}
            label="avg cost-per-wear"
            accent
          />
          <StatCard
            value={
              <span className="block truncate text-[22px]">
                {mostWorn ? mostWorn.item_name ?? mostWorn.label ?? mostWorn.brand ?? '—' : '—'}
              </span>
            }
            label={mostWorn ? `most worn · ${mostWorn.times_worn}×` : 'most worn piece'}
          />
        </div>

        <WardrobeView items={items} userId={user.id} />
      </div>
    </div>
  )
}
