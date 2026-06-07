-- ============================================================
-- FitSpace Database Schema (FULL — with triggers & new features)
-- Run this whole file in the Supabase SQL Editor.
-- Counters (likes_count, comments_count, followers_count, etc.)
-- are maintained automatically by triggers — your app code never
-- has to increment them manually.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  style_personas text[] default '{}',
  body_type text,
  size_top text,
  size_bottom text,
  size_shoes text,
  followers_count int default 0,
  following_count int default 0,
  posts_count int default 0,
  onboarded boolean default false,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can insert their own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile" on profiles for update using (auth.uid() = id);

-- ─────────────────────────────────────────
-- POSTS
-- ─────────────────────────────────────────
create table public.posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  caption text,
  image_url text not null,
  image_urls text[] default '{}',
  event_tags text[] default '{}',
  style_tags text[] default '{}',
  aesthetic_tags text[] default '{}',
  challenge_tag text,
  season text,
  total_outfit_cost numeric(10,2),
  ratings_enabled boolean default false,
  hidden boolean default false,
  likes_count int default 0,
  comments_count int default 0,
  saves_count int default 0,
  rating_avg numeric(3,1),
  rating_count int default 0,
  -- full-text search vector over caption + tags (maintained by trigger below)
  search_tsv tsvector,
  created_at timestamptz default now()
);

-- Keep search_tsv up to date on insert/update (immutable-safe approach)
create or replace function public.fn_posts_search_tsv() returns trigger
language plpgsql as $$
begin
  new.search_tsv :=
    to_tsvector('english',
      coalesce(new.caption, '') || ' ' ||
      coalesce(array_to_string(new.event_tags, ' '), '') || ' ' ||
      coalesce(array_to_string(new.style_tags, ' '), '') || ' ' ||
      coalesce(array_to_string(new.aesthetic_tags, ' '), '')
    );
  return new;
end; $$;
create trigger trg_posts_search_tsv
before insert or update on public.posts
for each row execute function public.fn_posts_search_tsv();

create index posts_search_idx on public.posts using gin (search_tsv);
create index posts_event_tags_idx on public.posts using gin (event_tags);
create index posts_aesthetic_tags_idx on public.posts using gin (aesthetic_tags);
create index posts_user_created_idx on public.posts (user_id, created_at desc);
alter table public.posts enable row level security;
create policy "Visible posts are viewable by everyone" on posts for select using (hidden = false or auth.uid() = user_id);
create policy "Users can create their own posts" on posts for insert with check (auth.uid() = user_id);
create policy "Users can update their own posts" on posts for update using (auth.uid() = user_id);
create policy "Users can delete their own posts" on posts for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- OUTFIT ITEMS (pinned tags on a post photo)
-- ─────────────────────────────────────────
create table public.outfit_items (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  label text,
  brand text,
  item_name text,
  price numeric(10,2),
  currency text default 'USD',
  purchase_url text,
  affiliate_url text,
  position_x numeric(5,2),
  position_y numeric(5,2),
  created_at timestamptz default now()
);
create index outfit_items_post_idx on public.outfit_items (post_id);
create index outfit_items_brand_idx on public.outfit_items (lower(brand));
alter table public.outfit_items enable row level security;
create policy "Outfit items are viewable by everyone" on outfit_items for select using (true);
create policy "Users can manage items on their own posts" on outfit_items for all using (
  auth.uid() = (select user_id from posts where id = post_id)
);

-- ─────────────────────────────────────────
-- WARDROBE ITEMS (private virtual closet)
-- ─────────────────────────────────────────
create table public.wardrobe_items (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  label text,
  brand text,
  item_name text,
  purchase_price numeric(10,2),
  date_purchased date,
  image_url text,
  category text,
  color_tags text[] default '{}',
  times_worn int default 0,
  last_worn_at date,
  is_wishlist boolean default false,
  wishlist_url text,
  wishlist_price numeric(10,2),
  created_at timestamptz default now()
);
create index wardrobe_user_idx on public.wardrobe_items (user_id);
alter table public.wardrobe_items enable row level security;
create policy "Wardrobe items are private by default" on wardrobe_items for all using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- OUTFIT LOGS (daily calendar)
-- ─────────────────────────────────────────
create table public.outfit_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date_worn date not null,
  wardrobe_item_ids uuid[] default '{}',
  post_id uuid references public.posts(id) on delete set null,
  notes text,
  created_at timestamptz default now(),
  unique(user_id, date_worn)
);
alter table public.outfit_logs enable row level security;
create policy "Outfit logs are private" on outfit_logs for all using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- FOLLOWS
-- ─────────────────────────────────────────
create table public.follows (
  follower_id uuid references public.profiles(id) on delete cascade,
  following_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id)
);
alter table public.follows enable row level security;
create policy "Follows are viewable by everyone" on follows for select using (true);
create policy "Users can follow/unfollow" on follows for all using (auth.uid() = follower_id);

-- ─────────────────────────────────────────
-- LIKES
-- ─────────────────────────────────────────
create table public.likes (
  user_id uuid references public.profiles(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, post_id)
);
alter table public.likes enable row level security;
create policy "Likes are viewable by everyone" on likes for select using (true);
create policy "Users can like/unlike" on likes for all using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- COMMENTS
-- ─────────────────────────────────────────
create table public.comments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  body text not null,
  created_at timestamptz default now()
);
create index comments_post_idx on public.comments (post_id, created_at);
alter table public.comments enable row level security;
create policy "Comments are viewable by everyone" on comments for select using (true);
create policy "Users can create comments" on comments for insert with check (auth.uid() = user_id);
create policy "Users can delete their own comments" on comments for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- SAVES (post saved by a user — drives saves_count)
-- ─────────────────────────────────────────
create table public.saves (
  user_id uuid references public.profiles(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, post_id)
);
alter table public.saves enable row level security;
create policy "Saves are private" on saves for all using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- COLLECTIONS (boards)
-- ─────────────────────────────────────────
create table public.collections (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  is_public boolean default true,
  post_ids uuid[] default '{}',
  created_at timestamptz default now()
);
alter table public.collections enable row level security;
create policy "Public collections are viewable by everyone" on collections for select using (is_public = true or auth.uid() = user_id);
create policy "Users can manage their own collections" on collections for all using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- CHALLENGES
-- ─────────────────────────────────────────
create table public.challenges (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  tag text unique not null,
  start_date date,
  end_date date,
  submission_count int default 0,
  created_at timestamptz default now()
);
alter table public.challenges enable row level security;
create policy "Challenges are viewable by everyone" on challenges for select using (true);

-- ─────────────────────────────────────────
-- STYLE BATTLES
-- ─────────────────────────────────────────
create table public.style_battles (
  id uuid default uuid_generate_v4() primary key,
  post_id_a uuid references public.posts(id) on delete cascade not null,
  post_id_b uuid references public.posts(id) on delete cascade not null,
  theme text,
  votes_a int default 0,
  votes_b int default 0,
  active boolean default true,
  created_at timestamptz default now()
);
create table public.battle_votes (
  user_id uuid references public.profiles(id) on delete cascade,
  battle_id uuid references public.style_battles(id) on delete cascade,
  voted_for uuid references public.posts(id),
  created_at timestamptz default now(),
  primary key (user_id, battle_id)
);
alter table public.style_battles enable row level security;
alter table public.battle_votes enable row level security;
create policy "Battles are viewable by everyone" on style_battles for select using (true);
create policy "Battle votes are viewable by everyone" on battle_votes for select using (true);
create policy "Users can vote once per battle" on battle_votes for insert with check (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- RATINGS
-- ─────────────────────────────────────────
create table public.ratings (
  user_id uuid references public.profiles(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  creativity int check (creativity between 1 and 10),
  wearability int check (wearability between 1 and 10),
  overall int check (overall between 1 and 10),
  created_at timestamptz default now(),
  primary key (user_id, post_id)
);
alter table public.ratings enable row level security;
create policy "Ratings are viewable by everyone" on ratings for select using (true);
create policy "Users can rate once per post" on ratings for all using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,   -- recipient
  actor_id uuid references public.profiles(id) on delete cascade not null,  -- who did it
  type text not null check (type in ('like','comment','follow')),
  post_id uuid references public.posts(id) on delete cascade,
  read boolean default false,
  created_at timestamptz default now()
);
create index notifications_user_idx on public.notifications (user_id, read, created_at desc);
alter table public.notifications enable row level security;
create policy "Users see only their notifications" on notifications for select using (auth.uid() = user_id);
create policy "Users can update their notifications" on notifications for update using (auth.uid() = user_id);
-- inserts happen via triggers (security definer), so no insert policy needed for clients

-- ─────────────────────────────────────────
-- REPORTS (moderation)
-- ─────────────────────────────────────────
create table public.reports (
  id uuid default uuid_generate_v4() primary key,
  reporter_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  reason text not null,
  resolved boolean default false,
  created_at timestamptz default now(),
  check (post_id is not null or comment_id is not null)
);
-- One report per user per target (comment reports also carry post_id as
-- context, so post-report uniqueness applies only to rows without one)
create unique index reports_unique_post_report on public.reports (reporter_id, post_id)
  where comment_id is null;
create unique index reports_unique_comment_report on public.reports (reporter_id, comment_id)
  where comment_id is not null;
alter table public.reports enable row level security;
create policy "Users can file reports" on reports for insert with check (auth.uid() = reporter_id);
create policy "Users can see their own reports" on reports for select using (auth.uid() = reporter_id);

-- ============================================================
-- TRIGGER FUNCTIONS — self-maintaining counters & notifications
-- All are SECURITY DEFINER so they can update counters / insert
-- notifications regardless of the acting user's RLS.
-- ============================================================

-- ---------- LIKES ----------
create or replace function public.handle_like() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    update posts set likes_count = likes_count + 1 where id = new.post_id;
    -- notify post owner (skip self-likes)
    insert into notifications (user_id, actor_id, type, post_id)
    select p.user_id, new.user_id, 'like', new.post_id
    from posts p where p.id = new.post_id and p.user_id <> new.user_id;
  elsif (tg_op = 'DELETE') then
    update posts set likes_count = greatest(likes_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end; $$;
create trigger trg_like_ins after insert on likes for each row execute function handle_like();
create trigger trg_like_del after delete on likes for each row execute function handle_like();

-- ---------- COMMENTS ----------
create or replace function public.handle_comment() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    update posts set comments_count = comments_count + 1 where id = new.post_id;
    insert into notifications (user_id, actor_id, type, post_id)
    select p.user_id, new.user_id, 'comment', new.post_id
    from posts p where p.id = new.post_id and p.user_id <> new.user_id;
  elsif (tg_op = 'DELETE') then
    update posts set comments_count = greatest(comments_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end; $$;
create trigger trg_comment_ins after insert on comments for each row execute function handle_comment();
create trigger trg_comment_del after delete on comments for each row execute function handle_comment();

-- ---------- SAVES ----------
create or replace function public.handle_save() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    update posts set saves_count = saves_count + 1 where id = new.post_id;
  elsif (tg_op = 'DELETE') then
    update posts set saves_count = greatest(saves_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end; $$;
create trigger trg_save_ins after insert on saves for each row execute function handle_save();
create trigger trg_save_del after delete on saves for each row execute function handle_save();

-- ---------- FOLLOWS ----------
create or replace function public.handle_follow() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    update profiles set following_count = following_count + 1 where id = new.follower_id;
    update profiles set followers_count = followers_count + 1 where id = new.following_id;
    insert into notifications (user_id, actor_id, type)
    values (new.following_id, new.follower_id, 'follow');
  elsif (tg_op = 'DELETE') then
    update profiles set following_count = greatest(following_count - 1, 0) where id = old.follower_id;
    update profiles set followers_count = greatest(followers_count - 1, 0) where id = old.following_id;
  end if;
  return null;
end; $$;
create trigger trg_follow_ins after insert on follows for each row execute function handle_follow();
create trigger trg_follow_del after delete on follows for each row execute function handle_follow();

-- ---------- POSTS COUNT ----------
create or replace function public.handle_post_count() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    update profiles set posts_count = posts_count + 1 where id = new.user_id;
  elsif (tg_op = 'DELETE') then
    update profiles set posts_count = greatest(posts_count - 1, 0) where id = old.user_id;
  end if;
  return null;
end; $$;
create trigger trg_post_count_ins after insert on posts for each row execute function handle_post_count();
create trigger trg_post_count_del after delete on posts for each row execute function handle_post_count();

-- ---------- RATINGS (recompute avg + count) ----------
create or replace function public.handle_rating() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  target_post uuid := coalesce(new.post_id, old.post_id);
begin
  update posts p set
    rating_count = (select count(*) from ratings r where r.post_id = target_post),
    rating_avg = (select round(avg(r.overall)::numeric, 1) from ratings r where r.post_id = target_post)
  where p.id = target_post;
  return null;
end; $$;
create trigger trg_rating_ins after insert on ratings for each row execute function handle_rating();
create trigger trg_rating_upd after update on ratings for each row execute function handle_rating();
create trigger trg_rating_del after delete on ratings for each row execute function handle_rating();

-- ---------- BATTLE VOTES ----------
create or replace function public.handle_battle_vote() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (new.voted_for = (select post_id_a from style_battles where id = new.battle_id)) then
    update style_battles set votes_a = votes_a + 1 where id = new.battle_id;
  else
    update style_battles set votes_b = votes_b + 1 where id = new.battle_id;
  end if;
  return null;
end; $$;
create trigger trg_battle_vote_ins after insert on battle_votes for each row execute function handle_battle_vote();

-- ---------- CHALLENGE SUBMISSION COUNT ----------
create or replace function public.handle_challenge_submission() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT' and new.challenge_tag is not null) then
    update challenges set submission_count = submission_count + 1 where tag = new.challenge_tag;
  elsif (tg_op = 'DELETE' and old.challenge_tag is not null) then
    update challenges set submission_count = greatest(submission_count - 1, 0) where tag = old.challenge_tag;
  end if;
  return null;
end; $$;
create trigger trg_challenge_sub_ins after insert on posts for each row execute function handle_challenge_submission();
create trigger trg_challenge_sub_del after delete on posts for each row execute function handle_challenge_submission();

-- ---------- AUTO-CREATE PROFILE ON SIGNUP ----------
-- Creates a profiles row automatically when a new auth user is created.
-- username defaults to the part before @ in their email; they can change it in onboarding.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 4))
  )
  on conflict (id) do nothing;
  return new;
end; $$;
create trigger trg_new_user after insert on auth.users for each row execute function handle_new_user();
