-- Gold Hall — Supabase setup.
--
-- Run this once in your Supabase project: Dashboard → SQL Editor → New query →
-- paste this file → Run. It creates the content table, opens it for public
-- reading, and creates the storage bucket used for uploaded pictures.
--
-- Nothing here contains secrets. The site talks to Supabase with the
-- service_role key supplied as an environment variable, which bypasses the
-- row-level policies below — the policies exist so the *public* anon key could
-- never write, even if it leaked.

-- ---------------------------------------------------------------------------
-- 1. Content table
-- ---------------------------------------------------------------------------
-- One row per content item. `type` is the section (executives, events,
-- gallery, scholarships, internships), `sort` keeps the admin's ordering.

create table if not exists public.content_items (
  id         text primary key,
  type       text not null,
  title      text not null default '',
  text       text not null default '',
  meta       text not null default '',
  link       text not null default '',
  label      text not null default '',
  image      text not null default '',
  position   text not null default '50% 50%',
  published  boolean not null default true,
  sort       integer not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists content_items_type_sort_idx
  on public.content_items (type, sort);

-- Keep updated_at honest.
create or replace function public.content_items_touch()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists content_items_touch on public.content_items;
create trigger content_items_touch
  before update on public.content_items
  for each row execute function public.content_items_touch();

-- ---------------------------------------------------------------------------
-- 2. Row level security
-- ---------------------------------------------------------------------------
-- The public site only ever reads, and it reads through the server, so this
-- is belt-and-braces: with RLS on and no write policy, the anon key is
-- read-only. Writes come from the service_role key, which bypasses RLS.

alter table public.content_items enable row level security;

drop policy if exists "content is public readable" on public.content_items;
create policy "content is public readable"
  on public.content_items
  for select
  using (true);

-- ---------------------------------------------------------------------------
-- 3. Storage bucket for uploaded pictures
-- ---------------------------------------------------------------------------
-- Public so the pages can show the pictures with a plain <img> URL.

insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do update set public = true;

drop policy if exists "uploads are public readable" on storage.objects;
create policy "uploads are public readable"
  on storage.objects
  for select
  using (bucket_id = 'uploads');

-- ---------------------------------------------------------------------------
-- 4. Seed the content
-- ---------------------------------------------------------------------------
-- You do not have to insert the rows by hand. After setting the environment
-- variables, open the admin portal once and use "Import seed content", or run
-- from a shell:
--
--   curl -X POST "$SITE/api/content.php?action=seed"
--
-- The site also reads straight from includes/seed-content.php until the table
-- has rows, so nothing looks broken in the meantime.
