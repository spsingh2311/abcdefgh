-- Run this in Supabase Dashboard > SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null check (category in ('certificates','internships','education','projects','achievements','skills','experience','other')),
  organization text,
  date text,
  description text,
  tags text[] not null default '{}',
  link text,
  file_path text,
  file_name text,
  file_type text,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.portfolio_items enable row level security;

-- Public visitors can read published portfolio entries only.
create policy "Anyone can view published portfolio items"
on public.portfolio_items for select
to anon, authenticated
using (published = true);

-- Only the authenticated owner can create/update/delete their own entries.
create policy "Owner can insert portfolio items"
on public.portfolio_items for insert
to authenticated
with check (auth.uid() = owner_id);

create policy "Owner can update portfolio items"
on public.portfolio_items for update
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy "Owner can delete portfolio items"
on public.portfolio_items for delete
to authenticated
using (auth.uid() = owner_id);

-- Private document bucket. Do NOT make this bucket public.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio-private', 'portfolio-private', false, 10485760,
  array['application/pdf','image/jpeg','image/png'])
on conflict (id) do nothing;

create policy "Owner uploads into own folder"
on storage.objects for insert to authenticated
with check (bucket_id = 'portfolio-private' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Owner reads own originals"
on storage.objects for select to authenticated
using (bucket_id = 'portfolio-private' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Owner deletes own originals"
on storage.objects for delete to authenticated
using (bucket_id = 'portfolio-private' and (storage.foldername(name))[1] = auth.uid()::text);

-- The public preview is issued by the Edge Function using the service role.
-- The function checks that the requested path belongs to a published portfolio item.
