import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import MobileHeader from '@/components/MobileHeader'
import { createClient } from '@/lib/supabase/server'
import type { Post } from '@/types'
import EditPostForm, { type EditInitial } from './EditPostForm'

type Props = { params: { id: string } }

export default async function EditPostPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data } = await supabase
    .from('posts')
    .select('*, outfit_items(brand, item_name, price, purchase_url)')
    .eq('id', params.id)
    .maybeSingle()

  if (!data) {
    notFound()
  }
  const post = data as unknown as Post
  // Only the owner can edit; everyone else goes to the post
  if (post.user_id !== user.id) {
    redirect(`/post/${post.id}`)
  }

  const initial: EditInitial = {
    imageUrls: post.image_urls.length > 0 ? post.image_urls : [post.image_url],
    caption: post.caption ?? '',
    styleTags: post.style_tags,
    eventTags: post.event_tags,
    season: post.season ?? '',
    ratingsEnabled: post.ratings_enabled,
    items: (post.outfit_items ?? []).map((it) => ({
      brand: it.brand ?? '',
      item_name: it.item_name ?? '',
      price: it.price,
      purchase_url: it.purchase_url ?? '',
    })),
  }

  return (
    <div className="mx-auto max-w-lg px-5 pb-16">
      <MobileHeader />
      <div className="pt-7">
        <Link
          href={`/post/${post.id}`}
          className="text-[12.5px] font-medium text-ink-soft transition-colors hover:text-rust"
        >
          ← Back to fit
        </Link>
        <h1 className="mt-3 font-serif text-[29px] font-medium tracking-[-0.4px]">Edit fit</h1>
        <p className="mt-1.5 text-[13.5px] text-ink-soft">
          Update the photos, details, and pieces.
        </p>
      </div>
      <div className="mt-8">
        <EditPostForm postId={post.id} userId={user.id} initial={initial} />
      </div>
    </div>
  )
}
