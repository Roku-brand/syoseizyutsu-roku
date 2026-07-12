-- 処世術禄 Dynamic App schema
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '名無し',
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz not null default now()
);
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 100),
  body text not null check (char_length(body) between 1 and 3000),
  category text not null default '人生',
  tags text[] not null default '{}',
  status text not null default 'published' check (status in ('draft','published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.favorites (
  user_id uuid references public.profiles(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists posts_created_at_idx on public.posts(created_at desc);
create index if not exists posts_category_idx on public.posts(category);
create index if not exists comments_post_id_idx on public.comments(post_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, display_name)
  values(new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)));
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.favorites enable row level security;
alter table public.comments enable row level security;

create policy "profiles readable" on public.profiles for select using (true);
create policy "own profile update" on public.profiles for update using (auth.uid() = id)
with check (auth.uid() = id and role = (select role from public.profiles where id = auth.uid()));
create policy "published posts readable" on public.posts for select using (status='published' or auth.uid()=user_id);
create policy "users create own posts" on public.posts for insert with check (auth.uid()=user_id);
create policy "owners or admins update posts" on public.posts for update using (
 auth.uid()=user_id or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')
);
create policy "owners or admins delete posts" on public.posts for delete using (
 auth.uid()=user_id or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')
);
create policy "favorites readable" on public.favorites for select using (true);
create policy "own favorites insert" on public.favorites for insert with check (auth.uid()=user_id);
create policy "own favorites delete" on public.favorites for delete using (auth.uid()=user_id);
create policy "comments readable" on public.comments for select using (true);
create policy "users create comments" on public.comments for insert with check (auth.uid()=user_id);
create policy "owners or admins delete comments" on public.comments for delete using (
 auth.uid()=user_id or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')
);

create or replace view public.post_feed as
select p.*, pr.display_name,
 count(distinct f.user_id)::int as favorite_count,
 count(distinct c.id)::int as comment_count
from public.posts p join public.profiles pr on pr.id=p.user_id
left join public.favorites f on f.post_id=p.id
left join public.comments c on c.post_id=p.id
where p.status='published'
group by p.id, pr.display_name;