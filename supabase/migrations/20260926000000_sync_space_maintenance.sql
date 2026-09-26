-- Mantém o status de manutenção da sala em sincronia com as ocorrências, dentro
-- do próprio banco.
--
-- Antes, o site tentava mudar spaces.status (LIVRE <-> MANUTENCAO) sempre que uma
-- ocorrência era aberta, resolvida ou apagada. Só que a RLS de spaces só deixa
-- Administrador, Direção e Suporte alterarem uma sala. Quando um Professor abria
-- ou apagava a própria ocorrência, o UPDATE era recusado e a sala ficava presa em
-- MANUTENCAO (ou nunca entrava em manutenção). Com este gatilho (SECURITY DEFINER),
-- a regra vale para qualquer cargo.
--
-- Regra: se a sala tem alguma ocorrência não resolvida -> MANUTENCAO.
--        se não tem nenhuma e estava em MANUTENCAO      -> LIVRE.

create or replace function public.sync_space_maintenance_status()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_space text;
  v_open boolean;
begin
  if tg_op = 'DELETE' then
    v_space := old.space_id;
  else
    v_space := new.space_id;
  end if;

  if v_space is null then
    return null;
  end if;

  select exists (
    select 1 from public.occurrences o
    where o.space_id = v_space and o.status is distinct from 'RESOLVIDO'
  ) into v_open;

  if v_open then
    update public.spaces set status = 'MANUTENCAO'
    where id = v_space and status is distinct from 'MANUTENCAO';
  else
    update public.spaces set status = 'LIVRE'
    where id = v_space and status = 'MANUTENCAO';
  end if;

  return null;
end;
$$;

drop trigger if exists trg_sync_space_maintenance on public.occurrences;
create trigger trg_sync_space_maintenance
after insert or delete or update of status, space_id on public.occurrences
for each row execute function public.sync_space_maintenance_status();

-- Conserta as salas que já estão presas em MANUTENCAO sem nenhuma ocorrência aberta.
update public.spaces s
set status = 'LIVRE'
where s.status = 'MANUTENCAO'
  and not exists (
    select 1 from public.occurrences o
    where o.space_id = s.id and o.status is distinct from 'RESOLVIDO'
  );
