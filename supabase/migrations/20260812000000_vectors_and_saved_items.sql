-- ============================================================
-- NanoBot Vectors and Saved Items Schema
-- Version: 1.1.0
-- ============================================================

-- 1. Vectors Table (pgvector & vector records store)
create table if not exists public.vectors (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  input_text text not null,
  source_filename text,
  dimensions integer not null,
  magnitude double precision not null,
  model text not null,
  vector_store text not null default 'Supabase pgvector (HNSW Index)',
  chunks_count integer not null default 1,
  vector jsonb not null default '[]'::jsonb,
  chunks jsonb default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- 2. Saved Items Table
create table if not exists public.saved_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  item_type text not null check (item_type in ('conversation', 'vector', 'document', 'code')),
  content text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_vectors_user_id on public.vectors(user_id, created_at desc);
create index if not exists idx_saved_items_user_id on public.saved_items(user_id, created_at desc);

-- Enable RLS
alter table public.vectors enable row level security;
alter table public.saved_items enable row level security;

-- RLS Policies
create policy "Users can view and manage own vectors" on public.vectors
  for all using (auth.uid() = user_id);

create policy "Users can view and manage own saved items" on public.saved_items
  for all using (auth.uid() = user_id);
