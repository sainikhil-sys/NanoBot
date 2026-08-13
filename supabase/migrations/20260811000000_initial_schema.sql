-- ============================================================
-- NanoBot Production Database Schema
-- Version: 1.0.0
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Enable pgcrypto for secure cryptographic operations
create extension if not exists "pgcrypto";

-- 1. Profiles Table (Extends auth.users)
create table if not exists public.profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade unique not null,
  display_name text,
  avatar_url text,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Bots Table (System Bot Definitions)
create table if not exists public.bots (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  slug text not null unique,
  description text not null,
  category text not null,
  status text not null default 'active' check (status in ('active', 'idle', 'busy', 'maintenance')),
  capabilities jsonb not null default '[]'::jsonb,
  avatar_icon text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Bot Capabilities Table
create table if not exists public.bot_capabilities (
  id uuid primary key default uuid_generate_v4(),
  bot_id uuid not null references public.bots(id) on delete cascade,
  capability text not null,
  description text,
  created_at timestamptz not null default now()
);

-- 4. Tasks Table
create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bot_id uuid references public.bots(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed', 'cancelled')),
  task_type text not null default 'auto',
  input_payload jsonb default '{}'::jsonb,
  result jsonb,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. Task Steps Table (Detailed layer execution stages)
create table if not exists public.task_steps (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  step_order integer not null,
  layer text not null,
  step_name text not null,
  status text not null default 'waiting' check (status in ('waiting', 'running', 'completed', 'failed', 'skipped')),
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  message text,
  metadata jsonb default '{}'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  duration_ms integer,
  created_at timestamptz not null default now()
);

-- 6. Task Events Table (High-frequency real-time event log)
create table if not exists public.task_events (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  step_id uuid references public.task_steps(id) on delete cascade,
  event_type text not null,
  level text not null default 'info' check (level in ('info', 'warn', 'error', 'debug')),
  layer text not null,
  message text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 7. Conversations Table
create table if not exists public.conversations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bot_id uuid not null references public.bots(id) on delete cascade,
  title text not null default 'New Conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 8. Messages Table
create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 9. Files Table
create table if not exists public.files (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  name text not null,
  path text not null,
  mime_type text not null,
  size bigint not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 10. Workflows Table
create table if not exists public.workflows (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  definition jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 11. Notifications Table
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('task_completed', 'task_failed', 'bot_status', 'system', 'security')),
  title text not null,
  message text not null,
  read boolean not null default false,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Indexes for High Performance
-- ============================================================
create index if not exists idx_profiles_user_id on public.profiles(user_id);
create index if not exists idx_bots_slug on public.bots(slug);
create index if not exists idx_tasks_user_id on public.tasks(user_id);
create index if not exists idx_tasks_status on public.tasks(status);
create index if not exists idx_tasks_created_at on public.tasks(created_at desc);
create index if not exists idx_task_steps_task_id on public.task_steps(task_id, step_order);
create index if not exists idx_task_events_task_id on public.task_events(task_id, created_at asc);
create index if not exists idx_conversations_user_id on public.conversations(user_id);
create index if not exists idx_messages_conversation_id on public.messages(conversation_id, created_at asc);
create index if not exists idx_files_user_id on public.files(user_id);
create index if not exists idx_notifications_user_read on public.notifications(user_id, read, created_at desc);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
alter table public.profiles enable row level security;
alter table public.bots enable row level security;
alter table public.bot_capabilities enable row level security;
alter table public.tasks enable row level security;
alter table public.task_steps enable row level security;
alter table public.task_events enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.files enable row level security;
alter table public.workflows enable row level security;
alter table public.notifications enable row level security;

-- Profiles: users can read & update their own profile
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = user_id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = user_id);

-- Bots & Capabilities: globally readable for all authenticated & anon users
create policy "Bots are viewable by everyone" on public.bots
  for select using (true);

create policy "Bot capabilities are viewable by everyone" on public.bot_capabilities
  for select using (true);

-- Tasks: user scoped
create policy "Users can view own tasks" on public.tasks
  for select using (auth.uid() = user_id);

create policy "Users can insert own tasks" on public.tasks
  for insert with check (auth.uid() = user_id);

create policy "Users can update own tasks" on public.tasks
  for update using (auth.uid() = user_id);

create policy "Users can delete own tasks" on public.tasks
  for delete using (auth.uid() = user_id);

-- Task Steps: user can view steps for own tasks
create policy "Users can view own task steps" on public.task_steps
  for select using (
    exists (select 1 from public.tasks where tasks.id = task_steps.task_id and tasks.user_id = auth.uid())
  );

-- Task Events: user can view events for own tasks
create policy "Users can view own task events" on public.task_events
  for select using (
    exists (select 1 from public.tasks where tasks.id = task_events.task_id and tasks.user_id = auth.uid())
  );

-- Conversations & Messages: user scoped
create policy "Users can view own conversations" on public.conversations
  for select using (auth.uid() = user_id);

create policy "Users can insert own conversations" on public.conversations
  for insert with check (auth.uid() = user_id);

create policy "Users can view own messages" on public.messages
  for select using (
    exists (select 1 from public.conversations where conversations.id = messages.conversation_id and conversations.user_id = auth.uid())
  );

create policy "Users can insert own messages" on public.messages
  for insert with check (
    exists (select 1 from public.conversations where conversations.id = messages.conversation_id and conversations.user_id = auth.uid())
  );

-- Files: user scoped
create policy "Users can manage own files" on public.files
  for all using (auth.uid() = user_id);

-- Workflows: user scoped
create policy "Users can manage own workflows" on public.workflows
  for all using (auth.uid() = user_id);

-- Notifications: user scoped
create policy "Users can view and manage own notifications" on public.notifications
  for all using (auth.uid() = user_id);

-- ============================================================
-- Seed System Bot Definitions (Authentic definitions)
-- ============================================================
insert into public.bots (name, slug, description, category, status, capabilities, avatar_icon)
values
  (
    'ChatBot',
    'chatbot',
    'Specialized in conversational reasoning, interactive task guidance, and contextual multi-turn dialogue.',
    'Conversational',
    'active',
    '["Conversational Reasoning", "Contextual Dialogue", "Task Guidance", "Prompt Refinement"]'::jsonb,
    'ChatCircle'
  ),
  (
    'CodeBot',
    'codebot',
    'Specialized in algorithmic synthesis, Abstract Syntax Tree inspection, static security heuristics, and refactoring.',
    'Engineering',
    'active',
    '["Syntax Analysis", "AST Parsing", "Complexity Profiling", "Security Linting", "Algorithmic Synthesis"]'::jsonb,
    'Code'
  ),
  (
    'VisionBot',
    'visionbot',
    'Specialized in tensor transformation, spatial feature extraction, classification, and visual anomaly detection.',
    'Computer Vision',
    'active',
    '["Tensor Transformation", "Spatial Feature Extraction", "Visual Classification", "Bounding & Salience Mapping"]'::jsonb,
    'Eye'
  ),
  (
    'ResearchBot',
    'researchbot',
    'Specialized in technical literature synthesis, hypothesis validation, cross-referencing, and factual citation extraction.',
    'Research',
    'active',
    '["Literature Synthesis", "Semantic Ranking", "Citation Extraction", "Fact Verification"]'::jsonb,
    'Books'
  ),
  (
    'DocumentBot',
    'documentbot',
    'Specialized in structured document parsing, multi-section text extraction, OCR alignment, and content summarization.',
    'Documents',
    'active',
    '["Document Parsing", "Hierarchical Extraction", "Summary Generation", "Table Serialization"]'::jsonb,
    'FileText'
  ),
  (
    'DataBot',
    'databot',
    'Specialized in statistical distribution modeling, isolation forest anomaly detection, and matrix correlation analysis.',
    'Data Science',
    'active',
    '["Anomaly Detection", "Distribution Profiling", "Correlation Analysis", "Matrix Transformation"]'::jsonb,
    'ChartBar'
  ),
  (
    'StudyBot',
    'studybot',
    'Specialized in pedagogical breakdown, step-by-step conceptual deconstruction, and structured learning verification.',
    'Education',
    'active',
    '["Pedagogical Deconstruction", "Step-by-Step Synthesis", "Conceptual Verification", "Knowledge Distillation"]'::jsonb,
    'GraduationCap'
  )
on conflict (slug) do update set
  description = excluded.description,
  capabilities = excluded.capabilities,
  status = excluded.status;
