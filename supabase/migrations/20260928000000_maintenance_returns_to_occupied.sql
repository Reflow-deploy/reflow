-- Quando uma sala em uso (com uma alocação em andamento) recebe uma ocorrência,
-- ela vai para MANUTENCAO (comportamento já existente). Até aqui, ao resolver ou
-- apagar a última ocorrência aberta, o gatilho sempre devolvia a sala para LIVRE —
-- mesmo que a alocação que a ocupava ainda estivesse em andamento. Esta migration
-- corrige isso: sem nenhuma ocorrência aberta, a sala volta para OCUPADO se ainda
-- houver uma alocação de hoje cobrindo o horário atual, e só cai para LIVRE quando
-- não houver mais nenhuma.
--
-- "Agora" é calculado no fuso America/Sao_Paulo (a escola é no Rio de Janeiro),
-- já que allocations.date/start_time/end_time são gravados como data e horário
-- "de parede" do navegador do usuário, sem fuso embutido.

create or replace function public.sync_space_maintenance_status()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_space text;
  v_open boolean;
  v_active_alloc boolean;
  v_now timestamp;
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
    return null;
  end if;

  -- Sem ocorrência aberta: a sala volta para OCUPADO se uma alocação de hoje
  -- ainda estiver em andamento agora, senão volta para LIVRE.
  v_now := now() at time zone 'America/Sao_Paulo';

  select exists (
    select 1 from public.allocations a
    where a.space_id = v_space
      and a.date = v_now::date
      and a.start_time::time <= v_now::time
      and a.end_time::time > v_now::time
  ) into v_active_alloc;

  if v_active_alloc then
    update public.spaces set status = 'OCUPADO'
    where id = v_space and status is distinct from 'OCUPADO';
  else
    update public.spaces set status = 'LIVRE'
    where id = v_space and status = 'MANUTENCAO';
  end if;

  return null;
end;
$$;

-- Conserta agora as salas que ficaram em MANUTENCAO sem nenhuma ocorrência aberta,
-- aplicando a mesma regra (volta para OCUPADO se há alocação em andamento, senão LIVRE).
do $$
declare
  v_now timestamp := now() at time zone 'America/Sao_Paulo';
begin
  update public.spaces s
  set status = 'OCUPADO'
  where s.status = 'MANUTENCAO'
    and not exists (
      select 1 from public.occurrences o
      where o.space_id = s.id and o.status is distinct from 'RESOLVIDO'
    )
    and exists (
      select 1 from public.allocations a
      where a.space_id = s.id
        and a.date = v_now::date
        and a.start_time::time <= v_now::time
        and a.end_time::time > v_now::time
    );

  update public.spaces s
  set status = 'LIVRE'
  where s.status = 'MANUTENCAO'
    and not exists (
      select 1 from public.occurrences o
      where o.space_id = s.id and o.status is distinct from 'RESOLVIDO'
    );
end $$;
