'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { OUTFITS_BUCKET, WARDROBE_CATEGORIES } from '@/lib/constants'

export type NewWardrobeItem = {
  imageUrl: string | null
  label: string
  brand: string
  item_name: string
  price: number | null
  date_purchased: string | null
  category: string | null
  color_tags: string[]
  is_wishlist: boolean
  wishlist_url: string
}

export async function addWardrobeItem(input: NewWardrobeItem): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  if (!input.brand.trim() && !input.item_name.trim() && !input.label.trim()) {
    return { error: 'Give the item at least a name, brand, or label.' }
  }

  // Photos are uploaded client-side; only accept our storage under this user's folder
  const storagePrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${OUTFITS_BUCKET}/${user.id}/`
  if (input.imageUrl && !input.imageUrl.startsWith(storagePrefix)) {
    return { error: 'Invalid image URL.' }
  }

  const category =
    input.category && (WARDROBE_CATEGORIES as string[]).includes(input.category)
      ? input.category
      : null

  const price = input.price != null && input.price >= 0 ? input.price : null

  const { error } = await supabase.from('wardrobe_items').insert({
    user_id: user.id,
    image_url: input.imageUrl,
    label: input.label.trim() || null,
    brand: input.brand.trim() || null,
    item_name: input.item_name.trim() || null,
    purchase_price: input.is_wishlist ? null : price,
    date_purchased: input.is_wishlist ? null : input.date_purchased || null,
    category,
    color_tags: input.color_tags.slice(0, 8),
    is_wishlist: input.is_wishlist,
    wishlist_url: input.is_wishlist ? input.wishlist_url.trim() || null : null,
    wishlist_price: input.is_wishlist ? price : null,
  })
  if (error) return { error: error.message }

  revalidatePath('/wardrobe')
  return { error: null }
}

export async function deleteWardrobeItem(itemId: string): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  // RLS scopes wardrobe_items to the owner
  const { error } = await supabase
    .from('wardrobe_items')
    .delete()
    .match({ id: itemId, user_id: user.id })
  if (error) return { error: error.message }

  revalidatePath('/wardrobe')
  return { error: null }
}
