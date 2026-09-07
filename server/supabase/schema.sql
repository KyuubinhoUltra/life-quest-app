-- Life Quest — Comunidade (feed de fotos de treino)
-- Cole este arquivo inteiro no SQL Editor do seu projeto Supabase e rode uma vez.

-- ---- profiles ----
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
  avatar text not null default '💪',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles are viewable by everyone" on public.profiles;
create policy "profiles are viewable by everyone"
  on public.profiles for select
  using (true);

drop policy if exists "users can update their own profile" on public.profiles;
create policy "users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- cria o profile automaticamente quando alguém se cadastra
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', 'user_' || substr(new.id::text, 1, 8))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---- posts ----
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  photo_url text not null,
  caption text,
  created_at timestamptz not null default now()
);

alter table public.posts enable row level security;

drop policy if exists "posts are viewable by everyone" on public.posts;
create policy "posts are viewable by everyone"
  on public.posts for select
  using (true);

drop policy if exists "users can insert their own posts" on public.posts;
create policy "users can insert their own posts"
  on public.posts for insert
  with check (auth.uid() = user_id);

drop policy if exists "users can delete their own posts" on public.posts;
create policy "users can delete their own posts"
  on public.posts for delete
  using (auth.uid() = user_id);

-- ---- likes ----
create table if not exists public.likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.likes enable row level security;

drop policy if exists "likes are viewable by everyone" on public.likes;
create policy "likes are viewable by everyone"
  on public.likes for select
  using (true);

drop policy if exists "users can like as themselves" on public.likes;
create policy "users can like as themselves"
  on public.likes for insert
  with check (auth.uid() = user_id);

drop policy if exists "users can remove their own like" on public.likes;
create policy "users can remove their own like"
  on public.likes for delete
  using (auth.uid() = user_id);

-- ---- storage bucket para as fotos ----
insert into storage.buckets (id, name, public)
values ('workout-photos', 'workout-photos', true)
on conflict (id) do nothing;

drop policy if exists "workout photos are publicly readable" on storage.objects;
create policy "workout photos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'workout-photos');

drop policy if exists "authenticated users can upload workout photos" on storage.objects;
create policy "authenticated users can upload workout photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'workout-photos');

drop policy if exists "users can delete their own workout photos" on storage.objects;
create policy "users can delete their own workout photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'workout-photos' and owner = auth.uid());
