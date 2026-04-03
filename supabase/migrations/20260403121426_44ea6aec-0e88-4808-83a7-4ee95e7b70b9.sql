-- Trading sessions table
create table public.trading_sessions (
  id uuid primary key default gen_random_uuid(),
  starting_capital numeric not null default 1000,
  daily_target_percent numeric not null default 4.0,
  trading_start_date date not null default (now()::date),
  trading_end_date date not null default ((date_trunc('year', now()) + interval '1 year' - interval '1 day')::date),
  accountability_partner text not null default '',
  pin_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trade entries table
create table public.trade_entries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.trading_sessions(id) on delete cascade,
  entry_date date not null,
  actual_result numeric,
  deposit numeric not null default 0,
  withdrawal numeric not null default 0,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, entry_date)
);

-- Edit log table
create table public.edit_log (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.trading_sessions(id) on delete cascade,
  field text not null,
  old_value text not null default '',
  new_value text not null default '',
  day_index integer,
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_trade_entries_session on public.trade_entries(session_id);
create index idx_trade_entries_date on public.trade_entries(session_id, entry_date);
create index idx_edit_log_session on public.edit_log(session_id);

-- View to hide pin_hash
create view public.trading_sessions_public
with (security_invoker = on) as
  select id, starting_capital, daily_target_percent, trading_start_date, trading_end_date,
         accountability_partner, created_at, updated_at,
         (pin_hash is not null) as has_pin
  from public.trading_sessions;

-- Enable RLS
alter table public.trading_sessions enable row level security;
alter table public.trade_entries enable row level security;
alter table public.edit_log enable row level security;

-- RLS policies for anonymous access (link-based sharing)
create policy "Anyone can create sessions" on public.trading_sessions for insert to anon with check (true);
create policy "Anyone can read sessions" on public.trading_sessions for select to anon using (true);
create policy "Anyone can update sessions" on public.trading_sessions for update to anon using (true) with check (true);

create policy "Anyone can read trade entries" on public.trade_entries for select to anon using (true);
create policy "Anyone can insert trade entries" on public.trade_entries for insert to anon with check (true);
create policy "Anyone can update trade entries" on public.trade_entries for update to anon using (true) with check (true);
create policy "Anyone can delete trade entries" on public.trade_entries for delete to anon using (true);

create policy "Anyone can read edit log" on public.edit_log for select to anon using (true);
create policy "Anyone can insert edit log" on public.edit_log for insert to anon with check (true);

-- Enable realtime
alter publication supabase_realtime add table public.trading_sessions;
alter publication supabase_realtime add table public.trade_entries;
alter publication supabase_realtime add table public.edit_log;

-- Helper function to verify PIN
create or replace function public.verify_session_pin(session_uuid uuid, provided_hash text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.trading_sessions
    where id = session_uuid and pin_hash = provided_hash
  )
$$;