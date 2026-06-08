'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MAX_POST_IMAGES, OUTFITS_BUCKET, SEASONS } from '@/lib/constants'
import type { Database } from '@/types/database'

type OutfitItemInsert = Database['public']['Tables']['outfit_items']['Insert']

export type NewOutfitItem = {
  brand: string
  item_name: string
  price: number | null
  purchase_url: string
}

export type NewPostInput = {
  imageUrls: string[]
  caption: string
  styleTags: string[]
  eventTags: string[]
  season: string | null
  challengeTag: string | null
  ratingsEnabled: boolean
  items: NewOutfitItem[]
}

export async function publishPost(input: NewPostInput): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated.' }
  }

  // Images are uploaded client-side; only accept URLs from the outfits
  // bucket under this user's own folder (mirrors the storage RLS policy).
  const storagePrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${OUTFITS_BUCKET}/${user.id}/`
  const imageUrls = input.imageUrls.slice(0, MAX_POST_IMAGES)
  if (imageUrls.length === 0) {
    return { error: 'A post needs at least one photo.' }
  }
  if (imageUrls.some((url) => !url.startsWith(storagePrefix))) {
    return { error: 'Invalid image URL.' }
  }

  const season = input.season && (SEASONS as string[]).includes(input.season) ? input.season : null
  const caption = input.caption.trim().slice(0, 2200) || null

  // Only accept a challenge_tag that actually exists — the submission_count
  // trigger keys off it, and a stray tag would silently enter nothing
  let challengeTag: string | null = null
  if (input.challengeTag) {
    const { data: challenge } = await supabase
      .from('challenges')
      .select('tag')
      .eq('tag', input.challengeTag)
      .maybeSingle()
    challengeTag = challenge?.tag ?? null
  }

  // Drop empty item rows; keep anything with at least a brand or name
  const items = input.items.filter((item) => item.brand.trim() || item.item_name.trim())
  const totalCost = items.reduce((sum, item) => sum + (item.price ?? 0), 0)

  const { data: post, error: postError } = await supabase
    .from('posts')
    .insert({
      user_id: user.id,
      image_url: imageUrls[0],
      image_urls: imageUrls,
      caption,
      style_tags: input.styleTags.slice(0, 10),
      event_tags: input.eventTags.slice(0, 10),
      season,
      challenge_tag: challengeTag,
      ratings_enabled: input.ratingsEnabled,
      total_outfit_cost: totalCost > 0 ? totalCost : null,
    })
    .select('id')
    .single()

  if (postError || !post) {
    return { error: postError?.message ?? 'Failed to create post.' }
  }

  if (items.length > 0) {
    const itemInserts: OutfitItemInsert[] = items.map((item) => ({
      post_id: post.id,
      brand: item.brand.trim() || null,
      item_name: item.item_name.trim() || null,
      price: item.price,
      currency: 'USD',
      purchase_url: item.purchase_url.trim() || null,
    }))
    const { error: itemsError } = await supabase.from('outfit_items').insert(itemInserts)
    if (itemsError) {
      // Post exists without items — surface the error rather than failing silently
      return { error: `Post created, but outfit items failed to save: ${itemsError.message}` }
    }
  }

  revalidatePath('/feed')
  redirect('/feed')
}

export type EditPostInput = {
  imageUrls: string[]
  caption: string
  styleTags: string[]
  eventTags: string[]
  season: string | null
  ratingsEnabled: boolean
  items: NewOutfitItem[]
}

// Full edit: photos, text/metadata, and outfit items. RLS restricts the
// update to the owner. Outfit items are replaced wholesale (delete + insert)
// and total_outfit_cost is recomputed; photos removed during the edit are
// pruned from storage so they don't orphan.
export async function updatePost(
  postId: string,
  input: EditPostInput
): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated.' }
  }

  const storagePrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${OUTFITS_BUCKET}/${user.id}/`
  const imageUrls = input.imageUrls.slice(0, MAX_POST_IMAGES)
  if (imageUrls.length === 0) {
    return { error: 'A post needs at least one photo.' }
  }
  if (imageUrls.some((url) => !url.startsWith(storagePrefix))) {
    return { error: 'Invalid image URL.' }
  }

  // Confirm ownership and grab the current photos for orphan cleanup
  const { data: existing } = await supabase
    .from('posts')
    .select('image_url, image_urls')
    .eq('id', postId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!existing) {
    return { error: 'Post not found.' }
  }

  const season = input.season && (SEASONS as string[]).includes(input.season) ? input.season : null
  const caption = input.caption.trim().slice(0, 2200) || null
  const items = input.items.filter((item) => item.brand.trim() || item.item_name.trim())
  const totalCost = items.reduce((sum, item) => sum + (item.price ?? 0), 0)

  const { error } = await supabase
    .from('posts')
    .update({
      image_url: imageUrls[0],
      image_urls: imageUrls,
      caption,
      style_tags: input.styleTags.slice(0, 10),
      event_tags: input.eventTags.slice(0, 10),
      season,
      ratings_enabled: input.ratingsEnabled,
      total_outfit_cost: totalCost > 0 ? totalCost : null,
    })
    .eq('id', postId)
    .eq('user_id', user.id) // belt-and-suspenders alongside RLS
  if (error) {
    return { error: error.message }
  }

  // Replace the outfit items wholesale
  const { error: delItemsError } = await supabase.from('outfit_items').delete().eq('post_id', postId)
  if (delItemsError) {
    return { error: delItemsError.message }
  }
  if (items.length > 0) {
    const itemInserts: OutfitItemInsert[] = items.map((item) => ({
      post_id: postId,
      brand: item.brand.trim() || null,
      item_name: item.item_name.trim() || null,
      price: item.price,
      currency: 'USD',
      purchase_url: item.purchase_url.trim() || null,
    }))
    const { error: itemsError } = await supabase.from('outfit_items').insert(itemInserts)
    if (itemsError) {
      return { error: `Saved the fit, but outfit items failed: ${itemsError.message}` }
    }
  }

  // Prune photos that were removed during the edit (best-effort)
  const publicPrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${OUTFITS_BUCKET}/`
  const oldUrls = existing.image_urls?.length ? existing.image_urls : [existing.image_url]
  const orphanPaths = oldUrls
    .filter((url): url is string => Boolean(url) && !imageUrls.includes(url) && url.startsWith(publicPrefix))
    .map((url) => url.slice(publicPrefix.length))
  if (orphanPaths.length > 0) {
    await supabase.storage.from(OUTFITS_BUCKET).remove(orphanPaths)
  }

  revalidatePath(`/post/${postId}`)
  revalidatePath('/feed')
  redirect(`/post/${postId}`)
}

// Delete a post. RLS enforces ownership; outfit_items, likes, comments,
// ratings, and notifications cascade on the FK.
export async function deletePost(postId: string): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated.' }
  }

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/feed')
  revalidatePath('/profile')
  redirect('/feed')
}
