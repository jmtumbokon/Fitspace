'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type PostInsert = Database['public']['Tables']['posts']['Insert']
type OutfitItemInsert = Database['public']['Tables']['outfit_items']['Insert']

type OutfitItemInput = {
  label: string
  brand: string
  item_name: string
  price: number | null
  purchase_url: string | null
  position_x: number
  position_y: number
}

type PublishPostInput = {
  imageUrl: string
  caption: string
  eventTags: string[]
  styleTags: string[]
  aestheticTags: string[]
  items: OutfitItemInput[]
}

export async function publishPost(input: PublishPostInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const totalCost = input.items.reduce((sum, item) => sum + (item.price ?? 0), 0)

  const postInsert: PostInsert = {
    user_id: user.id,
    image_url: input.imageUrl,
    caption: input.caption || null,
    event_tags: input.eventTags,
    style_tags: input.styleTags,
    aesthetic_tags: input.aestheticTags,
    total_outfit_cost: totalCost > 0 ? totalCost : null,
  }

  const { data: post, error: postError } = await supabase
    .from('posts')
    .insert(postInsert)
    .select('id')
    .single<{ id: string }>()

  if (postError || !post) throw new Error(postError?.message ?? 'Failed to create post')

  if (input.items.length > 0) {
    const itemInserts: OutfitItemInsert[] = input.items.map((item) => ({
      post_id: post.id,
      label: item.label || null,
      brand: item.brand || null,
      item_name: item.item_name || null,
      price: item.price,
      currency: 'USD',
      purchase_url: item.purchase_url || null,
      position_x: item.position_x,
      position_y: item.position_y,
    }))

    const { error: itemsError } = await supabase.from('outfit_items').insert(itemInserts)
    if (itemsError) throw new Error(itemsError.message)
  }

  redirect('/feed')
}
