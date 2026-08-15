begin;

alter table public.occurrences add column resolved_at timestamptz;

comment on column public.occurrences.resolved_at is
  'Timestamp de quando o status mudou para RESOLVIDO, setado automaticamente '
  'pelo trigger abaixo. Volta para NULL se o chamado for reaberto — só é '
  'válido para o ciclo de resolução atual.';

-- BEFORE UPDATE (não AFTER como os triggers de admin_audit_log) porque
-- estamos mutando a própria linha sendo atualizada (new.resolved_at := ...).
create or replace function public.set_occurrence_resolved_at()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if new.status = 'RESOLVIDO' and old.status is distinct from 'RESOLVIDO' then
    new.resolved_at := now();
  elsif new.status <> 'RESOLVIDO' and old.status = 'RESOLVIDO' then
    new.resolved_at := null;
  end if;
  return new;
end;
$function$;

revoke execute on function public.set_occurrence_resolved_at() from public, anon, authenticated;

drop trigger if exists trg_set_occurrence_resolved_at on public.occurrences;

create trigger trg_set_occurrence_resolved_at
  before update on public.occurrences
  for each row
  when (new.status is distinct from old.status)
  execute function public.set_occurrence_resolved_at();

commit;
