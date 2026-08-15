-- Quando um colaborador com conta de Auth vinculada (user_id) é excluído de
-- public.collaborators, este trigger remove também a conta correspondente em
-- auth.users, para que a pessoa não "ressuscite" como Pendente no próximo
-- login (custom_access_token_hook recria a linha em collaborators sempre que
-- não encontra nenhuma vinculada ao user_id que fez login).
--
-- Antes de apagar auth.users, solta o vínculo de FK em
-- occurrences.reported_by_user_id (constraint NO ACTION, sem CASCADE nem SET
-- NULL automático) para não violar a constraint. O texto livre
-- "reported_by" na ocorrência é preservado; só o vínculo com a conta de
-- Auth é removido.
create or replace function public.delete_auth_user_on_collaborator_delete()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  update public.occurrences
    set reported_by_user_id = null
    where reported_by_user_id = old.user_id;

  delete from auth.users where id = old.user_id;

  return old;
end;
$$;

drop trigger if exists trg_delete_auth_user_after_collaborator_delete on public.collaborators;

create trigger trg_delete_auth_user_after_collaborator_delete
  after delete on public.collaborators
  for each row
  when (old.user_id is not null)
  execute function public.delete_auth_user_on_collaborator_delete();

-- Defesa em profundidade: essa função só deve rodar via o trigger acima
-- (que a invoca como o owner, postgres). Funções SECURITY DEFINER novas são
-- expostas por padrão via PostgREST em /rest/v1/rpc/<nome> para anon e
-- authenticated — como é uma função de trigger (RETURNS trigger), chamá-la
-- diretamente já falha com "trigger functions can only be called as
-- triggers", mas revogar o EXECUTE fecha o aviso do linter de segurança
-- (anon/authenticated_security_definer_function_executable) sem custo.
revoke execute on function public.delete_auth_user_on_collaborator_delete() from public, anon, authenticated;
