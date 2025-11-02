-- Create profiles table (linked to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role text not null default 'member' check (role in ('member', 'organizer', 'admin')),
  city text,
  bio text,
  avatar_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create communities table
create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  category text not null check (category in ('Tech', 'Business', 'Arts', 'Sports', 'Education', 'Social', 'Other')),
  city text not null,
  image_url text,
  organizer_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create events table
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  community_id uuid not null references public.communities(id) on delete cascade,
  organizer_id uuid not null references public.profiles(id) on delete cascade,
  event_date timestamp with time zone not null,
  duration_hours integer not null check (duration_hours >= 1 and duration_hours <= 12),
  venue_name text not null,
  address text not null,
  city text not null,
  is_online boolean default false,
  max_attendees integer,
  image_url text,
  status text default 'upcoming' check (status in ('upcoming', 'past', 'cancelled')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create rsvps table
create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(event_id, user_id)
);

-- Create community_followers table
create table if not exists public.community_followers (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(community_id, user_id)
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.communities enable row level security;
alter table public.events enable row level security;
alter table public.rsvps enable row level security;
alter table public.community_followers enable row level security;

-- Profiles RLS Policies
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles_delete_own"
  on public.profiles for delete
  using (auth.uid() = id);

-- Communities RLS Policies
create policy "communities_select_all"
  on public.communities for select
  using (true);

create policy "communities_insert_own"
  on public.communities for insert
  with check (auth.uid() = organizer_id);

create policy "communities_update_own"
  on public.communities for update
  using (auth.uid() = organizer_id);

create policy "communities_delete_own"
  on public.communities for delete
  using (auth.uid() = organizer_id);

-- Events RLS Policies
create policy "events_select_all"
  on public.events for select
  using (true);

create policy "events_insert_own"
  on public.events for insert
  with check (auth.uid() = organizer_id);

create policy "events_update_own"
  on public.events for update
  using (auth.uid() = organizer_id);

create policy "events_delete_own"
  on public.events for delete
  using (auth.uid() = organizer_id);

-- RSVPs RLS Policies
create policy "rsvps_select_own"
  on public.rsvps for select
  using (auth.uid() = user_id or auth.uid() in (select organizer_id from public.events where id = event_id));

create policy "rsvps_insert_own"
  on public.rsvps for insert
  with check (auth.uid() = user_id);

create policy "rsvps_delete_own"
  on public.rsvps for delete
  using (auth.uid() = user_id);

-- Community Followers RLS Policies
create policy "followers_select_all"
  on public.community_followers for select
  using (true);

create policy "followers_insert_own"
  on public.community_followers for insert
  with check (auth.uid() = user_id);

create policy "followers_delete_own"
  on public.community_followers for delete
  using (auth.uid() = user_id);

-- Create trigger to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', new.email),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
