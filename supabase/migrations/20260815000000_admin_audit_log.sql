begin;

-- 1. TABELA
create table public.admin_audit_log (
  id              uuid primary key default gen_random_uuid(),
  actor_user_id   uuid references auth.users(id) on delete set null,
  action          text not null check (action in (
                    'ROLE_CHANGE', 'OCCURRENCE_DELETE', 'SPACE_UPDATE', 'SPACE_DELETE'
                  )),
  target_table    text not null,
  target_id       text not null,
  target_label    text,
  old_data        jsonb,
  new_data        jsonb,
  created_at      timestamptz not null default now()
);

comment on table public.admin_audit_log is
  'Log de auditoria imutável de ações administrativas sensíveis. Populado '
  'exclusivamente por triggers SECURITY DEFINER — nunca por INSERT direto do '
  'frontend. Não faz parte de "Limpar Histórico" (dbClearHistory).';

create index admin_audit_log_created_at_idx on public.admin_audit_log (created_at desc);
create index admin_audit_log_target_idx on public.admin_audit_log (target_table, target_id);

-- 2. RLS — só Administrador lê; ninguém escreve por fora dos triggers
alter table public.admin_audit_log enable row level security;

create policy "Admin le admin_audit_log"
  on public.admin_audit_log for select to authenticated
  using (public.is_admin());

revoke insert, update, delete on public.admin_audit_log from anon, authenticated;

-- 3. TRIGGER — Troca de cargo (dispara depois que trg_protect_system_role
--    já validou que quem fez foi Administrador)
create or replace function public.log_admin_role_change()
returns trigger language plpgsql security definer set search_path to ''
as $function$
begin
  if auth.uid() is null then
    return new; -- operação interna
  end if;
  insert into public.admin_audit_log (actor_user_id, action, target_table, target_id, target_label, old_data, new_data)
  values (auth.uid(), 'ROLE_CHANGE', 'collaborators', new.id, new.name,
          jsonb_build_object('system_role', old.system_role),
          jsonb_build_object('system_role', new.system_role));
  return new;
end;
$function$;

revoke execute on function public.log_admin_role_change() from public, anon, authenticated;

create trigger trg_log_admin_role_change
  after update on public.collaborators
  for each row
  when (new.system_role is distinct from old.system_role)
  execute function public.log_admin_role_change();

-- 4. TRIGGER — Exclusão de ocorrência
create or replace function public.log_admin_occurrence_delete()
returns trigger language plpgsql security definer set search_path to ''
as $function$
begin
  if auth.uid() is null then return old; end if;
  insert into public.admin_audit_log (actor_user_id, action, target_table, target_id, target_label, old_data, new_data)
  values (auth.uid(), 'OCCURRENCE_DELETE', 'occurrences', old.id,
          coalesce(old.space_name, old.id) || ' · ' || coalesce(old.failure_type, 'Falha não especificada'),
          to_jsonb(old), null);
  return old;
end;
$function$;

revoke execute on function public.log_admin_occurrence_delete() from public, anon, authenticated;

create trigger trg_log_admin_occurrence_delete
  after delete on public.occurrences
  for each row execute function public.log_admin_occurrence_delete();

-- 5. TRIGGER — Edição/Exclusão de sala. Só loga UPDATE quando algo
--    "administrativo" mudou, ou quando status entra/sai de MANUTENCAO —
--    ignora o toggle rotineiro LIVRE<->OCUPADO do fluxo de alocação.
create or replace function public.log_admin_space_change()
returns trigger language plpgsql security definer set search_path to ''
as $function$
begin
  if auth.uid() is null then return coalesce(new, old); end if;

  if TG_OP = 'DELETE' then
    insert into public.admin_audit_log (actor_user_id, action, target_table, target_id, target_label, old_data, new_data)
    values (auth.uid(), 'SPACE_DELETE', 'spaces', old.id, old.name, to_jsonb(old), null);
    return old;
  end if;

  insert into public.admin_audit_log (actor_user_id, action, target_table, target_id, target_label, old_data, new_data)
  values (auth.uid(), 'SPACE_UPDATE', 'spaces', new.id, new.name, to_jsonb(old), to_jsonb(new));
  return new;
end;
$function$;

revoke execute on function public.log_admin_space_change() from public, anon, authenticated;

create trigger trg_log_admin_space_update
  after update on public.spaces
  for each row
  when (
    new.name is distinct from old.name
    or new.type is distinct from old.type
    or new.capacity is distinct from old.capacity
    or new.block is distinct from old.block
    or new.equipments is distinct from old.equipments
    or new.desk_type is distinct from old.desk_type
    or new.svg_group_id is distinct from old.svg_group_id
    or (new.status is distinct from old.status and (new.status = 'MANUTENCAO' or old.status = 'MANUTENCAO'))
  )
  execute function public.log_admin_space_change();

create trigger trg_log_admin_space_delete
  after delete on public.spaces
  for each row execute function public.log_admin_space_change();

-- 6. RLS de spaces — restringe escrita a is_staff(); SELECT continua
--    liberado para todo aprovado (mapa interativo precisa disso).
drop policy "Aprovados leem e escrevem spaces" on public.spaces;

create policy "Aprovados leem spaces" on public.spaces for select to authenticated
  using (public.is_approved());
create policy "Staff cadastra spaces" on public.spaces for insert to authenticated
  with check (public.is_staff());
create policy "Staff atualiza spaces" on public.spaces for update to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy "Staff exclui spaces" on public.spaces for delete to authenticated
  using (public.is_staff());

commit;
