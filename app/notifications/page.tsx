import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import MobileHeader from '@/components/MobileHeader'
import { createClient } from '@/lib/supabase/server'
import { timeAgo } from '@/lib/utils'

// Notifications — trigger-populated on likes, comments, and follows; this
// page only reads them and flips `read`. RLS scopes rows to the recipient.

const PAGE_SIZE = 50

type NotificationRow = {
  id: string
  type: 'like' | 'comment' | 'follow'
  post_id: string | null
  read: boolean
  created_at: string
  actor: { username: string; display_name: string | null; avatar_url: string | null } | null
  post: { id: string; image_url: string } | null
}

const VERBS: Record<NotificationRow['type'], string> = {
  like: 'liked your fit',
  comment: 'commented on your fit',
  follow: 'followed your closet',
}

export default async function NotificationsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data, error } = await supabase
    .from('notifications')
    .select(
      'id, type, post_id, read, created_at, actor:profiles!notifications_actor_id_fkey(username, display_name, avatar_url), post:posts!notifications_post_id_fkey(id, image_url)'
    )
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE)

  const rows = (data ?? []) as unknown as NotificationRow[]

  // Mark everything read now that it's been seen — `read` was captured
  // above, so fresh rows still render with their "new" dot this visit.
  if (!error && rows.some((row) => !row.read)) {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)
  }

  return (
    <div className="mx-auto max-w-[1240px] px-5 pb-20 md:px-10">
      <MobileHeader />

      {/* View head */}
      <div className="mb-7 border-b border-line pb-4 pt-7">
        <h2 className="font-serif text-[27px] font-medium tracking-[-0.4px]">Notifications</h2>
        <p className="mt-[3px] text-[13.5px] text-ink-soft">
          Who liked, commented, and followed
        </p>
      </div>

      {error ? (
        <p className="rounded-lg bg-rust/10 px-3 py-2 text-sm text-rust">
          Couldn’t load notifications: {error.message}
        </p>
      ) : rows.length === 0 ? (
        <p className="mx-auto max-w-[680px] rounded-card border border-line bg-panel px-5 py-16 text-center text-sm text-ink-soft">
          All quiet — likes, comments, and new followers will land here.
        </p>
      ) : (
        <div className="mx-auto max-w-[680px] overflow-hidden rounded-card border border-line bg-panel">
          <div className="divide-y divide-line-soft">
            {rows.map((notification) => {
              const actor = notification.actor
              const name = actor?.display_name ?? actor?.username ?? 'someone'
              const fresh = !notification.read

              const body = (
                <>
                  {/* unread marker for this visit */}
                  <span
                    className={`h-[7px] w-[7px] shrink-0 rounded-full ${
                      fresh ? 'bg-rust' : 'bg-transparent'
                    }`}
                    aria-hidden
                  />
                  {actor?.avatar_url ? (
                    <Image
                      src={actor.avatar_url}
                      alt={name}
                      width={36}
                      height={36}
                      className="h-9 w-9 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bg2 text-[13px] font-bold uppercase text-ink-soft">
                      {(actor?.username ?? '?')[0]}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] leading-[1.35]">
                      <b className="font-semibold">{name}</b>{' '}
                      <span className="text-ink-soft">{VERBS[notification.type]}</span>
                    </span>
                    <span className="mt-[1px] block text-[11.5px] text-ink-soft/80">
                      {timeAgo(notification.created_at)}
                    </span>
                  </span>
                  {notification.post && (
                    <span className="relative h-[46px] w-[37px] shrink-0 overflow-hidden rounded-[6px] border border-line-soft">
                      <Image
                        src={notification.post.image_url}
                        alt="the fit"
                        fill
                        sizes="37px"
                        className="object-cover"
                      />
                    </span>
                  )}
                </>
              )

              // Like/comment rows link to the fit; follow rows are static
              return notification.post ? (
                <Link
                  key={notification.id}
                  href={`/post/${notification.post.id}`}
                  className="flex items-center gap-3 px-4 py-[13px] transition-colors duration-[220ms] hover:bg-bg2/50"
                >
                  {body}
                </Link>
              ) : (
                <div key={notification.id} className="flex items-center gap-3 px-4 py-[13px]">
                  {body}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
