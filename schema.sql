-- FitSpace Database Schema
-- Run this in your Supabase SQL editor to initialize the database

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────
-- USERS (extends Supabase auth.users)
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
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);

-- ─────────────────────────────────────────
-- POSTS
-- ─────────────────────────────────────────
create table public.posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  caption text,
  image_url text not null,
  image_urls text[] default '{}',          -- support multi-photo posts
  event_tags text[] default '{}',          -- e.g. ['picnic', 'date night']
  style_tags text[] default '{}',          -- e.g. ['streetwear', 'minimalist']
  aesthetic_tags text[] default '{}',      -- e.g. ['Y2K', 'cottagecore']
  season text,                             -- spring | summer | fall | winter
  total_outfit_cost numeric(10,2),         -- sum of all item prices
  likes_count int default 0,
  comments_count int default 0,
  saves_count int default 0,
  rating_avg numeric(3,1),                 -- optional community rating
  rating_count int default 0,
  created_at timestamptz default now()
);

alter table public.posts enable row level security;

create policy "Posts are viewable by everyone"
  on posts for select using (true);

create policy "Users can create their own posts"
  on posts for insert with check (auth.uid() = user_id);

create policy "Users can delete their own posts"
  on posts for delete using (auth.uid() = user_id);

-- Full-text search index on tags + caption
create index posts_search_idx on posts
  using gin(to_tsvector('english', coalesce(caption, '') || ' ' || array_to_string(event_tags, ' ') || ' ' || array_to_string(style_tags, ' ')));

-- ─────────────────────────────────────────
-- OUTFIT ITEMS (pinned tags on a post)
-- ─────────────────────────────────────────
create table public.outfit_items (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  label text,                              -- e.g. "Jacket", "Shoes"
  brand text,
  item_name text,
  price numeric(10,2),
  currency text default 'USD',
  purchase_url text,
  position_x numeric(5,2),               -- % from left on image (0-100)
  position_y numeric(5,2),               -- % from top on image (0-100)
  created_at timestamptz default now()
);

alter table public.outfit_items enable row level security;

create policy "Outfit items are viewable by everyone"
  on outfit_items for select using (true);

create policy "Users can manage items on their own posts"
  on outfit_items for all using (
    auth.uid() = (select user_id from posts where id = post_id)
  );

-- ─────────────────────────────────────────
-- WARDROBE ITEMS (virtual closet)
-- ─────────────────────────────────────────
create table public.wardrobe_items (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  label text,                              -- e.g. "Jacket"
  brand text,
  item_name text,
  purchase_price numeric(10,2),
  date_purchased date,
  image_url text,
  category text,                           -- tops | bottoms | shoes | outerwear | accessories
  color_tags text[] default '{}',
  times_worn int default 0,
  last_worn_at date,
  is_wishlist boolean default false,
  wishlist_url text,
  wishlist_price numeric(10,2),
  created_at timestamptz default now()
);

alter table public.wardrobe_items enable row level security;

create policy "Wardrobe items are private by default"
  on wardrobe_items for all using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- OUTFIT LOG (what you wore each day)
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

create policy "Outfit logs are private"
  on outfit_logs for all using (auth.uid() = user_id);

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

create policy "Follows are viewable by everyone"
  on follows for select using (true);

create policy "Users can follow/unfollow"
  on follows for all using (auth.uid() = follower_id);

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

create policy "Likes are viewable by everyone"
  on likes for select using (true);

create policy "Users can like/unlike"
  on likes for all using (auth.uid() = user_id);

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

alter table public.comments enable row level security;

create policy "Comments are viewable by everyone"
  on comments for select using (true);

create policy "Users can create comments"
  on comments for insert with check (auth.uid() = user_id);

create policy "Users can delete their own comments"
  on comments for delete using (auth.uid() = user_id);

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

create policy "Public collections are viewable by everyone"
  on collections for select using (is_public = true or auth.uid() = user_id);

create policy "Users can manage their own collections"
  on collections for all using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- CHALLENGES
-- ─────────────────────────────────────────
create table public.challenges (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  tag text unique not null,               -- hashtag used to enter (e.g. 'monochrome-week')
  start_date date,
  end_date date,
  submission_count int default 0,
  created_at timestamptz default now()
);

alter table public.challenges enable row level security;

create policy "Challenges are viewable by everyone"
  on challenges for select using (true);

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

create policy "Battles are viewable by everyone"
  on style_battles for select using (true);

create policy "Users can vote once per battle"
  on battle_votes for all using (auth.uid() = user_id);

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

create policy "Ratings are viewable by everyone"
  on ratings for select using (true);

create policy "Users can rate once per post"
  on ratings for all using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- TRIGGERS: keep counts in sync
-- ─────────────────────────────────────────

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Update likes_count on posts
create or replace function public.handle_like_change()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update posts set likes_count = likes_count + 1 where id = new.post_id;
  elsif (TG_OP = 'DELETE') then
    update posts set likes_count = likes_count - 1 where id = old.post_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger on_like_change
  after insert or delete on public.likes
  for each row execute procedure public.handle_like_change();

-- Update comments_count on posts
create or replace function public.handle_comment_change()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update posts set comments_count = comments_count + 1 where id = new.post_id;
  elsif (TG_OP = 'DELETE') then
    update posts set comments_count = comments_count - 1 where id = old.post_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger on_comment_change
  after insert or delete on public.comments
  for each row execute procedure public.handle_comment_change();

-- Update followers/following counts
create or replace function public.handle_follow_change()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update profiles set followers_count = followers_count + 1 where id = new.following_id;
    update profiles set following_count = following_count + 1 where id = new.follower_id;
  elsif (TG_OP = 'DELETE') then
    update profiles set followers_count = followers_count - 1 where id = old.following_id;
    update profiles set following_count = following_count - 1 where id = old.follower_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger on_follow_change
  after insert or delete on public.follows
  for each row execute procedure public.handle_follow_change();
