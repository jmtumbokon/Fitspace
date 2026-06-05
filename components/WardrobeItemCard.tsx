import Image from 'next/image'
import { swatchFor } from '@/lib/swatch'
import { formatPrice } from '@/lib/utils'
import type { WardrobeItem } from '@/types'

export function costPerWear(item: WardrobeItem): number | null {
  if (item.purchase_price == null || item.times_worn <= 0) return null
  return item.purchase_price / item.times_worn
}

// Small piece card from the mockup's .pitem — swatch/photo, brand,
// name, cost-per-wear. Gradient fallback for items with no photo.
export default function WardrobeItemCard({ item }: { item: WardrobeItem }) {
  const cpw = costPerWear(item)
  const name = item.item_name ?? item.label ?? 'Piece'

  return (
    <div className="flex-none basis-32 overflow-hidden rounded-[10px] border border-line-soft bg-panel transition-transform duration-[250ms] hover:-translate-y-[3px]">
      <div
        className="relative h-[104px]"
        style={item.image_url ? undefined : { background: swatchFor(item.id) }}
      >
        {item.image_url && (
          <Image src={item.image_url} alt={name} fill sizes="128px" className="object-cover" />
        )}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,.2),transparent_55%)]" />
      </div>
      <div className="px-[11px] py-[10px]">
        <div className="truncate text-[10.5px] font-bold uppercase tracking-[.4px] text-sage">
          {item.brand ?? '—'}
        </div>
        <div className="mb-[7px] mt-0.5 truncate text-[13px] font-semibold leading-[1.2]">
          {name}
        </div>
        {item.is_wishlist ? (
          <div className="flex justify-between text-[11px] text-ink-soft">
            <span>wishlist</span>
            <b className="font-bold text-rust">
              {item.wishlist_price != null ? formatPrice(item.wishlist_price) : '—'}
            </b>
          </div>
        ) : (
          <div className="flex justify-between text-[11px] text-ink-soft">
            <span>cost/wear</span>
            <b className="font-bold text-rust">
              {cpw != null ? formatPrice(cpw) : `worn ${item.times_worn}×`}
            </b>
          </div>
        )}
      </div>
    </div>
  )
}
