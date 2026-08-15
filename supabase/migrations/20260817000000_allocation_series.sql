begin;

alter table public.allocations add column series_id uuid;

comment on column public.allocations.series_id is
  'Agrupa ocorrências geradas por uma reserva recorrente (ex: "toda Segunda '
  'até dd/mm"). NULL para reservas avulsas — comportamento inalterado. Gerado '
  'no cliente (crypto.randomUUID()) uma única vez por série.';

create index if not exists idx_allocations_series_id
  on public.allocations (series_id)
  where series_id is not null;

commit;
