-- Execute este arquivo no SQL Editor do seu projeto Supabase.
create table if not exists public.workspace_data (
  user_id uuid not null references auth.users(id) on delete cascade,
  data_key text not null,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, data_key)
);

alter table public.workspace_data enable row level security;

drop policy if exists "Users can read their own workspace data" on public.workspace_data;
create policy "Users can read their own workspace data"
  on public.workspace_data for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own workspace data" on public.workspace_data;
create policy "Users can insert their own workspace data"
  on public.workspace_data for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own workspace data" on public.workspace_data;
create policy "Users can update their own workspace data"
  on public.workspace_data for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own workspace data" on public.workspace_data;
create policy "Users can delete their own workspace data"
  on public.workspace_data for delete to authenticated
  using (auth.uid() = user_id);

create index if not exists workspace_data_updated_at_idx
  on public.workspace_data (updated_at);
