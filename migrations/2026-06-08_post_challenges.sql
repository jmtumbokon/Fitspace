-- ============================================================
-- Migration: overlapping challenges (many-to-many post ↔ challenge)
-- Run ONCE in the Supabase SQL editor BEFORE deploying the matching app code.
-- Idempotent. posts.challenge_tag is kept as a legacy column (not dropped).
-- ============================================================

-- 1. Join table + RLS (read: everyone; insert/delete: the post's owner)
create table if not exists public.post_challenges (
  post_id uuid references public.posts(id) on delete cascade not null,
  challenge_id uuid references public.challenges(id) on delete cascade not null,
  created_at timestamptz default now(),
  primary key (post_id, challenge_id)
);
create index if not exists post_challenges_challenge_idx on public.post_challenges (challenge_id);
alter table public.post_challenges enable row level security;

drop policy if exists "Post challenges are viewable by everyone" on public.post_challenges;
create policy "Post challenges are viewable by everyone"
  on public.post_challenges for select using (true);

drop policy if exists "Owners can add their post to challenges" on public.post_challenges;
create policy "Owners can add their post to challenges"
  on public.post_challenges for insert
  with check (auth.uid() = (select user_id from public.posts where id = post_id));

drop policy if exists "Owners can remove their post from challenges" on public.post_challenges;
create policy "Owners can remove their post from challenges"
  on public.post_challenges for delete
  using (auth.uid() = (select user_id from public.posts where id = post_id));

-- 2. Remove the OLD count machinery keyed off posts.challenge_tag
drop trigger if exists trg_challenge_sub_ins on public.posts;
drop trigger if exists trg_challenge_sub_del on public.posts;
drop function if exists public.handle_challenge_submission();

-- 3. Backfill the join table from existing posts.challenge_tag
--    (runs BEFORE the new trigger exists, so it doesn't touch counts)
insert into public.post_challenges (post_id, challenge_id)
select p.id, c.id
from public.posts p
join public.challenges c on c.tag = p.challenge_tag
where p.challenge_tag is not null
on conflict (post_id, challenge_id) do nothing;

-- 4. New count maintenance, keyed off the join table
create or replace function public.handle_post_challenge() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    update public.challenges set submission_count = submission_count + 1 where id = new.challenge_id;
  elsif (tg_op = 'DELETE') then
    update public.challenges set submission_count = greatest(submission_count - 1, 0) where id = old.challenge_id;
  end if;
  return null;
end; $$;

drop trigger if exists trg_post_challenge_ins on public.post_challenges;
create trigger trg_post_challenge_ins after insert on public.post_challenges
  for each row execute function public.handle_post_challenge();
drop trigger if exists trg_post_challenge_del on public.post_challenges;
create trigger trg_post_challenge_del after delete on public.post_challenges
  for each row execute function public.handle_post_challenge();

-- 5. Recompute submission_count from the join table (now the source of truth)
update public.challenges c
set submission_count = (select count(*) from public.post_challenges pc where pc.challenge_id = c.id);
