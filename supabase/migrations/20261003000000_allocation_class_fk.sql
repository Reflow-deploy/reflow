-- Liga cada reserva à turma cadastrada (public.classes).
--
-- Até aqui, allocations.class_name guardava só o NOME da turma como texto solto,
-- sem nenhuma ligação com a tabela classes: renomear ou apagar uma turma não tinha
-- efeito nas reservas, e a checagem "mesma turma em duas salas" comparava texto.
--
-- Agora allocations.class_id aponta para classes.id (chave estrangeira).
-- - ON DELETE SET NULL: apagar uma turma NÃO apaga as reservas dela; só solta o vínculo.
-- - class_id é opcional (NULL) para não quebrar reservas antigas e porque class_name
--   continua existindo como cópia do nome na data da reserva.
-- Não há RLS nova: as policies de allocations já cobrem a coluna.

begin;

alter table public.allocations
  add column class_id text references public.classes(id) on delete set null;

comment on column public.allocations.class_id is
  'Turma para a qual a reserva foi feita (FK para classes.id). NULL se a turma foi '
  'apagada depois (ON DELETE SET NULL) ou para reservas criadas antes desta coluna. '
  'class_name segue guardando o nome da turma no momento da reserva.';

create index if not exists idx_allocations_class_id
  on public.allocations (class_id)
  where class_id is not null;

-- Preenche reservas existentes cujo nome casa exatamente com uma turma única.
-- (Na data desta migração a tabela estava vazia; isto só protege outros ambientes.)
update public.allocations a
   set class_id = c.id
  from public.classes c
 where a.class_id is null
   and c.name = a.class_name
   and (select count(*) from public.classes c2 where c2.name = a.class_name) = 1;

commit;
