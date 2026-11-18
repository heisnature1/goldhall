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
-- 4. Seeding happens by itself
-- ---------------------------------------------------------------------------
-- You do not insert the rows by hand, and there is no button or endpoint to
-- call. Once GOLDHALL_SUPABASE_URL and GOLDHALL_SUPABASE_KEY are set and the
-- site redeployed, the first read that finds this table empty fills it from
-- includes/seed-content.php. Up to that point the site renders the same file
-- directly, so nothing looks broken in the meantime.
--
-- `sort` is not yours to maintain: it keeps the order within a section, and
-- the code assigns it on import and on every save.

-- ---------------------------------------------------------------------------
-- 5. Repair: rows that lost their position
-- ---------------------------------------------------------------------------
-- A save used to upsert without `sort`, so every edited row was reset to the
-- column default of 0 and jumped to the top of its section. The code no longer
-- does that, but existing rows may still be collapsed. Check with:
--
--   select type, count(*), count(distinct sort)
--     from public.content_items
--    group by type;
--
-- Any type where the third number is smaller than the second has duplicates.
-- Renumber each section in its current display order with:
--
--   with ordered as (
--     select id, type,
--            row_number() over (partition by type order by sort, title) - 1 as n
--       from public.content_items
--   )
--   update public.content_items c
--      set sort = o.n
--     from ordered o
--    where o.id = c.id;
