-- ============================================================
-- NanoBot Workflow & Automation Engine Schema
-- Version: 2.0.0
-- Adds durable persistence for workflow versions, runs, automations,
-- idempotency keys and dead-letter jobs.
-- ============================================================

-- 1. Immutable workflow version snapshots
create table if not exists public.workflow_versions (
  id uuid primary key default uuid_generate_v4(),
  workflow_id uuid not null references public.workflows(id) on delete cascade,
  version integer not null,
  definition jsonb not null,
  created_at timestamptz not null default now(),
  unique (workflow_id, version)
);

-- 2. Workflow runs (execution records with full node trace)
create table if not exists public.workflow_runs (
  id text primary key,
  workflow_id uuid references public.workflows(id) on delete set null,
  workflow_name text not null,
  workflow_version integer,
  user_id uuid references auth.users(id) on delete cascade,
  status text not null check (status in ('running', 'completed', 'failed', 'cancelled')),
  trigger text not null,
  trigger_payload jsonb not null default '{}'::jsonb,
  idempotency_key text,
  node_executions jsonb not null default '[]'::jsonb,
  error text,
  dead_lettered boolean not null default false,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_ms double precision
);

-- 3. Idempotency ledger (at-most-once execution per key)
create table if not exists public.workflow_idempotency (
  idempotency_key text primary key,
  run_id text not null,
  created_at timestamptz not null default now()
);

-- 4. Dead-letter jobs (permanently failed runs)
create table if not exists public.dead_letter_jobs (
  id text primary key,
  run_id text not null,
  workflow_id uuid references public.workflows(id) on delete set null,
  workflow_name text not null,
  workflow_version integer,
  failed_node_id text,
  failed_node_title text,
  input jsonb not null default '{}'::jsonb,
  error text not null,
  attempts integer not null default 1,
  trigger text not null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- 5. Automations (trigger-to-workflow bindings)
create table if not exists public.automations (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  workflow_id uuid references public.workflows(id) on delete cascade,
  workflow_name text not null,
  trigger_type text not null check (trigger_type in ('schedule', 'webhook', 'file_upload', 'event', 'manual')),
  schedule text,
  timezone text default 'UTC',
  retry_policy jsonb,
  status text not null default 'active' check (status in ('active', 'paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_run_at timestamptz,
  last_run_status text,
  next_run_at timestamptz
);

-- ============================================================
-- Indexes
-- ============================================================
create index if not exists idx_workflow_versions_wf on public.workflow_versions(workflow_id, version desc);
create index if not exists idx_workflow_runs_wf on public.workflow_runs(workflow_id, started_at desc);
create index if not exists idx_workflow_runs_user on public.workflow_runs(user_id, started_at desc);
create index if not exists idx_workflow_runs_status on public.workflow_runs(status);
create index if not exists idx_dead_letter_unresolved on public.dead_letter_jobs(resolved_at, created_at desc);
create index if not exists idx_automations_user on public.automations(user_id, created_at desc);
create index if not exists idx_automations_due on public.automations(status, trigger_type, next_run_at);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.workflow_versions enable row level security;
alter table public.workflow_runs enable row level security;
alter table public.workflow_idempotency enable row level security;
alter table public.dead_letter_jobs enable row level security;
alter table public.automations enable row level security;

-- Workflow versions: visible when the parent workflow belongs to the user.
create policy "Users manage versions of own workflows" on public.workflow_versions
  for all using (
    exists (select 1 from public.workflows w where w.id = workflow_versions.workflow_id and w.user_id = auth.uid())
  );

-- Runs: user scoped.
create policy "Users manage own workflow runs" on public.workflow_runs
  for all using (auth.uid() = user_id);

-- Dead-letter jobs: visible when the parent workflow belongs to the user.
create policy "Users manage own dead letters" on public.dead_letter_jobs
  for all using (
    exists (select 1 from public.workflows w where w.id = dead_letter_jobs.workflow_id and w.user_id = auth.uid())
  );

-- Automations: user scoped.
create policy "Users manage own automations" on public.automations
  for all using (auth.uid() = user_id);

-- Idempotency ledger: readable/writable only via service role (no user policy).
