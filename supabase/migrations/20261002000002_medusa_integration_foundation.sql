-- Supabase side of the Medusa integration boundary.
-- This migration stores mappings/events only. Medusa remains the commerce source of truth.

create table if not exists public.medusa_entity_links (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in (
    'customer',
    'product',
    'product_variant',
    'order',
    'cart',
    'payment'
  )),
  supabase_id uuid,
  medusa_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entity_type, medusa_id),
  unique (entity_type, supabase_id)
);

create index if not exists medusa_entity_links_supabase_idx
  on public.medusa_entity_links (supabase_id)
  where supabase_id is not null;

create index if not exists medusa_entity_links_medusa_idx
  on public.medusa_entity_links (medusa_id);

alter table public.medusa_entity_links enable row level security;

-- The integration layer uses service_role. Customers never write commerce mappings directly.
drop policy if exists "service role manages medusa entity links" on public.medusa_entity_links;
create policy "service role manages medusa entity links"
  on public.medusa_entity_links
  for all
  to service_role
  using (true)
  with check (true);

create table if not exists public.integration_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  source_system text not null check (source_system in ('medusa', 'supabase')),
  event_type text not null,
  entity_type text,
  entity_id text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'processing', 'processed', 'failed')),
  retry_count integer not null default 0 check (retry_count >= 0),
  occurred_at timestamptz not null default now(),
  processed_at timestamptz,
  last_error text,
  created_at timestamptz not null default now()
);

create index if not exists integration_events_status_idx
  on public.integration_events (status, occurred_at);

create index if not exists integration_events_entity_idx
  on public.integration_events (entity_type, entity_id);

alter table public.integration_events enable row level security;

drop policy if exists "service role manages integration events" on public.integration_events;
create policy "service role manages integration events"
  on public.integration_events
  for all
  to service_role
  using (true)
  with check (true);

-- Keep updated_at automatic for mappings.
create or replace function public.touch_medusa_entity_link()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists medusa_entity_links_touch on public.medusa_entity_links;
create trigger medusa_entity_links_touch
before update on public.medusa_entity_links
for each row execute function public.touch_medusa_entity_link();

comment on table public.medusa_entity_links is
  'Cross-system identity mapping. Medusa remains authoritative for commerce entities.';
comment on table public.integration_events is
  'Idempotent Medusa/Supabase webhook and integration event inbox.';
