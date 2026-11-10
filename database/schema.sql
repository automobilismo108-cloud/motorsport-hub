-- MOTORSPORT HUB | PostgreSQL / Supabase
-- Execute no SQL Editor do Supabase. Estrutura preparada para múltiplas categorias.

create extension if not exists pgcrypto;

create table if not exists championships (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text not null unique,
  discipline text not null default 'circuit',
  country text,
  created_at timestamptz not null default now()
);

create table if not exists seasons (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid not null references championships(id),
  year integer not null,
  status text not null default 'planned' check (status in ('planned','active','completed')),
  created_at timestamptz not null default now(),
  unique (championship_id, year)
);

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text,
  country text,
  color_hex char(7),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists drivers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  nationality text,
  date_of_birth date,
  permanent_number integer,
  external_ref text,
  created_at timestamptz not null default now()
);

-- Inscrição do piloto em uma temporada/campeonato, sem sobrescrever a ficha global.
create table if not exists driver_entries (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons(id),
  driver_id uuid not null references drivers(id),
  team_id uuid references teams(id),
  car_number integer,
  entry_role text not null default 'race_driver'
    check (entry_role in ('race_driver','reserve','test')),
  entry_status text not null default 'active'
    check (entry_status in ('active','withdrawn','completed')),
  created_at timestamptz not null default now(),
  unique (season_id, driver_id)
);

-- Contratos são históricos: encerrar um contrato não apaga seu registro.
create table if not exists contracts (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references drivers(id),
  team_id uuid not null references teams(id),
  season_id uuid not null references seasons(id),
  start_date date not null,
  end_date date,
  salary_amount numeric(14,2),
  salary_currency char(3) default 'EUR',
  contract_status text not null default 'active'
    check (contract_status in ('active','expired','terminated','pending')),
  source_type text not null default 'verified'
    check (source_type in ('verified','simulated','user_entered')),
  created_at timestamptz not null default now(),
  check (end_date is null or end_date >= start_date)
);

create index if not exists idx_contracts_driver on contracts(driver_id);
create index if not exists idx_contracts_team on contracts(team_id);
create index if not exists idx_contracts_season on contracts(season_id);

create table if not exists transfer_offers (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references drivers(id),
  from_team_id uuid references teams(id),
  to_team_id uuid not null references teams(id),
  season_id uuid not null references seasons(id),
  offer_type text not null default 'permanent'
    check (offer_type in ('permanent','loan','promotion','release')),
  proposed_salary numeric(14,2),
  contract_years numeric(3,1),
  compatibility_score numeric(5,2),
  offer_status text not null default 'proposed'
    check (offer_status in ('proposed','accepted','rejected','withdrawn','expired')),
  decision_reason text,
  is_simulated boolean not null default true,
  proposed_at timestamptz not null default now(),
  decided_at timestamptz
);

create table if not exists transfer_events (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid references transfer_offers(id),
  driver_id uuid not null references drivers(id),
  from_team_id uuid references teams(id),
  to_team_id uuid references teams(id),
  season_id uuid not null references seasons(id),
  event_type text not null
    check (event_type in ('transfer','signing','release','renewal','retirement','promotion')),
  effective_date date not null,
  is_simulated boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_transfer_events_driver on transfer_events(driver_id);
create index if not exists idx_transfer_events_season on transfer_events(season_id);

create table if not exists races (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons(id),
  name text not null,
  round_number integer not null,
  circuit text,
  country text,
  race_date date,
  unique (season_id, round_number)
);

create table if not exists race_results (
  id uuid primary key default gen_random_uuid(),
  race_id uuid not null references races(id),
  driver_id uuid not null references drivers(id),
  team_id uuid references teams(id),
  finishing_position integer,
  points numeric(6,2) not null default 0,
  status text,
  unique (race_id, driver_id)
);

-- Segurança: habilitar RLS antes de expor tabelas a clientes autenticados.
-- As políticas de acesso por usuário serão adicionadas quando o módulo de login for implementado.
