-- Life Quest — Comunidade v2 (Clubes, Seguindo, Amigos)
-- Cole este arquivo no SQL Editor do Supabase DEPOIS de já ter rodado o schema.sql original.

-- ---- follows (segue / amigos = seguida mútua) ----
create table if not exists public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_no_self check (follower_id <> following_id)
);

alter table public.follows enable row level security;

drop policy if exists "follows are viewable by everyone" on public.follows;
create policy "follows are viewable by everyone"
  on public.follows for select
  using (true);

drop policy if exists "users can follow as themselves" on public.follows;
create policy "users can follow as themselves"
  on public.follows for insert
  with check (auth.uid() = follower_id);

drop policy if exists "users can unfollow their own follow" on public.follows;
create policy "users can unfollow their own follow"
  on public.follows for delete
  using (auth.uid() = follower_id);

-- ---- clubs ----
create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  icon text not null default '🏆',
  creator_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.clubs enable row level security;

drop policy if exists "clubs are viewable by everyone" on public.clubs;
create policy "clubs are viewable by everyone"
  on public.clubs for select
  using (true);

drop policy if exists "authenticated users can create clubs" on public.clubs;
create policy "authenticated users can create clubs"
  on public.clubs for insert
  to authenticated
  with check (auth.uid() = creator_id);

drop policy if exists "creators can delete their own clubs" on public.clubs;
create policy "creators can delete their own clubs"
  on public.clubs for delete
  using (auth.uid() = creator_id);

-- ---- club_members ----
create table if not exists public.club_members (
  club_id uuid not null references public.clubs (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (club_id, user_id)
);

alter table public.club_members enable row level security;

drop policy if exists "club members are viewable by everyone" on public.club_members;
create policy "club members are viewable by everyone"
  on public.club_members for select
  using (true);

drop policy if exists "users can join clubs as themselves" on public.club_members;
create policy "users can join clubs as themselves"
  on public.club_members for insert
  with check (auth.uid() = user_id);

drop policy if exists "users can leave clubs on their own" on public.club_members;
create policy "users can leave clubs on their own"
  on public.club_members for delete
  using (auth.uid() = user_id);

-- o criador de um clube já entra automaticamente como membro
create or replace function public.handle_new_club()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.club_members (club_id, user_id) values (new.id, new.creator_id);
  return new;
end;
$$;

drop trigger if exists on_club_created on public.clubs;
create trigger on_club_created
  after insert on public.clubs
  for each row execute procedure public.handle_new_club();

-- ---- posts ganham um clube opcional ----
alter table public.posts add column if not exists club_id uuid references public.clubs (id) on delete cascade;

-- posts sem clube (feed global) são públicos; posts de clube só aparecem pra membros
drop policy if exists "posts are viewable by everyone" on public.posts;
drop policy if exists "posts are viewable respecting club membership" on public.posts;
create policy "posts are viewable respecting club membership"
  on public.posts for select
  using (
    club_id is null
    or exists (
      select 1 from public.club_members m
      where m.club_id = posts.club_id and m.user_id = auth.uid()
    )
  );
