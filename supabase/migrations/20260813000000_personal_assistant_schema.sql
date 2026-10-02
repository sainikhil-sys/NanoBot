-- ============================================================
-- NanoBot Personal AI Assistant Schema
-- Version: 1.2.0
-- ============================================================

-- 1. Connected Accounts Table (OAuth credentials & state)
create table if not exists public.connected_accounts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('google', 'linkedin', 'github', 'custom')),
  provider_account_id text,
  email text,
  scopes text[] not null default '{}',
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  status text not null default 'connected' check (status in ('connected', 'disconnected', 'expired', 'error')),
  last_synced_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, provider)
);

-- 2. Personal Tasks Table
create table if not exists public.personal_tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  due_date timestamptz,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'cancelled')),
  category text not null default 'General',
  source_type text not null default 'manual' check (source_type in ('manual', 'email', 'chat', 'calendar', 'workflow')),
  source_id text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Personal Memory Table (Structured & Semantic facts)
create table if not exists public.personal_memory (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in (
    'profile', 'preferences', 'people', 'projects', 'meetings', 'tasks', 'communication_style', 'important_dates'
  )),
  key text not null,
  value text not null,
  confidence double precision not null default 1.0,
  is_pinned boolean not null default false,
  is_disabled boolean not null default false,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Interactive Approval Requests (Action confirmation queue)
create table if not exists public.approval_requests (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tool_name text not null,
  permission_level text not null default 'EXECUTE' check (permission_level in ('READ', 'PREPARE', 'EXECUTE')),
  action_type text not null,
  description text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'expired')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. Audit Logs Table (Personal AI operations tracing)
create table if not exists public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  tool text not null,
  target text,
  permission_level text not null default 'READ',
  approval_status text not null default 'auto',
  result_status text not null default 'success',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 6. Daily AI Briefings Table
create table if not exists public.daily_briefings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  summary text not null,
  email_highlights jsonb not null default '[]'::jsonb,
  calendar_highlights jsonb not null default '[]'::jsonb,
  task_highlights jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique(user_id, date)
);

-- Indexes for lightning fast lookups
create index if not exists idx_connected_accounts_user on public.connected_accounts(user_id);
create index if not exists idx_personal_tasks_user on public.personal_tasks(user_id, status, due_date);
create index if not exists idx_personal_memory_user on public.personal_memory(user_id, category);
create index if not exists idx_approval_requests_user on public.approval_requests(user_id, status);
create index if not exists idx_audit_logs_user on public.audit_logs(user_id, created_at desc);
create index if not exists idx_daily_briefings_user on public.daily_briefings(user_id, date desc);

-- Enable RLS across all new tables
alter table public.connected_accounts enable row level security;
alter table public.personal_tasks enable row level security;
alter table public.personal_memory enable row level security;
alter table public.approval_requests enable row level security;
alter table public.audit_logs enable row level security;
alter table public.daily_briefings enable row level security;

-- RLS Policies ensuring strict tenant isolation
create policy "Users can manage own connected accounts" on public.connected_accounts
  for all using (auth.uid() = user_id);

create policy "Users can manage own personal tasks" on public.personal_tasks
  for all using (auth.uid() = user_id);

create policy "Users can manage own personal memory" on public.personal_memory
  for all using (auth.uid() = user_id);

create policy "Users can manage own approval requests" on public.approval_requests
  for all using (auth.uid() = user_id);

create policy "Users can view own audit logs" on public.audit_logs
  for all using (auth.uid() = user_id);

create policy "Users can view own daily briefings" on public.daily_briefings
  for all using (auth.uid() = user_id);
