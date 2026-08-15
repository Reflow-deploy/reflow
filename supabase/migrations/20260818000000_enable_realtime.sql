begin;

-- Habilita o Supabase Realtime (postgres_changes) nas tabelas que alimentam
-- o estado da aplicação no frontend. Sem isso, INSERT/UPDATE/DELETE feitos
-- por um usuário só chegam aos outros usuários conectados quando eles dão
-- F5 (loadInitialData só roda uma vez, no mount de App.jsx).
--
-- A autorização desses eventos continua sendo feita pelas policies de RLS
-- já existentes (is_approved() etc.) — o Realtime só entrega a um cliente
-- as linhas que a policy de SELECT dele permitiria ler.
alter publication supabase_realtime add table public.spaces;
alter publication supabase_realtime add table public.allocations;
alter publication supabase_realtime add table public.occurrences;
alter publication supabase_realtime add table public.audit_logs;
alter publication supabase_realtime add table public.collaborators;
alter publication supabase_realtime add table public.classes;

commit;
