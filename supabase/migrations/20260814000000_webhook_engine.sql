-- ============================================================
-- NanoBot Webhook Engine Schema
-- Version: 2.1.0
-- Adds webhook signing secrets and a delivery log.
-- ============================================================

-- Signing secret for inbound webhook signature verification.
alter table public.automations
  add column if not exists webhook_secret text;

-- Webhook delivery log (one row per inbound call, including rejects/duplicates).
create table if not exists public.webhook_deliveries (
  id text primary key,
  automation_id text references public.automations(id) on delete cascade,
  event_id text not null,
  status text not null check (status in ('accepted', 'duplicate', 'rejected', 'error')),
  run_id text,
  reason text,
  received_at timestamptz not null default now()
);

create index if not exists idx_webhook_deliveries_automation
  on public.webhook_deliveries(automation_id, received_at desc);
create index if not exists idx_webhook_deliveries_event
  on public.webhook_deliveries(automation_id, event_id);

alter table public.webhook_deliveries enable row level security;

-- Deliveries are visible when the parent automation belongs to the user.
create policy "Users view own webhook deliveries" on public.webhook_deliveries
  for select using (
    exists (select 1 from public.automations a where a.id = webhook_deliveries.automation_id and a.user_id = auth.uid())
  );
