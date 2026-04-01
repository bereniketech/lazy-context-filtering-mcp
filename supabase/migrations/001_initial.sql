create table if not exists public.context_items (
  id text primary key,
  content text not null,
  source text not null,
  content_hash text not null unique,
  token_count integer not null check (token_count >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_context_items_source on public.context_items(source);
create index if not exists idx_context_items_created_at on public.context_items(created_at);

create table if not exists public.sessions (
  id text primary key,
  user_id text,
  query_count integer not null default 0 check (query_count >= 0),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sessions_expires_at on public.sessions(expires_at);
create index if not exists idx_sessions_user_id on public.sessions(user_id);

create table if not exists public.filter_cache (
  key text primary key,
  session_id text not null references public.sessions(id) on delete cascade,
  query_hash text not null,
  result_json text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_filter_cache_session_id on public.filter_cache(session_id);
create index if not exists idx_filter_cache_query_hash on public.filter_cache(query_hash);
create index if not exists idx_filter_cache_expires_at on public.filter_cache(expires_at);
