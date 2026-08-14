-- ============================================================
-- SCRIPT DE RESTAURAÇÃO E RECRIAÇÃO COMPLETA DAS TABELAS REFLOW
-- (Execute este código no SQL Editor do Supabase para corrigir a estrutura)
-- ============================================================

-- 0. DROPAR TABELAS ANTIGAS SE EXISTIREM (Para reset limpo)
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.occurrences CASCADE;
DROP TABLE IF EXISTS public.allocations CASCADE;
DROP TABLE IF EXISTS public.collaborators CASCADE;
DROP TABLE IF EXISTS public.classes CASCADE;
DROP TABLE IF EXISTS public.spaces CASCADE;

-- 1. TABELA DE ESPAÇOS E SALAS
CREATE TABLE public.spaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    capacity INT NOT NULL,
    block TEXT NOT NULL,
    status TEXT DEFAULT 'LIVRE', -- LIVRE | OCUPADO | MANUTENCAO
    svg_group_id TEXT,
    equipments JSONB,
    desk_type TEXT
);

-- 2. TABELA DE TURMAS
CREATE TABLE public.classes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    students_count INT NOT NULL
);

-- 3. TABELA DE COLABORADORES E DOCENTES
CREATE TABLE public.collaborators (
    id TEXT PRIMARY KEY,
    initials TEXT,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'PRESENTE',
    category TEXT NOT NULL,
    role TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    start_time TEXT,
    end_time TEXT,
    work_days TEXT[],
    notes TEXT
);

-- 4. TABELA DE AGENDAMENTOS E ALOCAÇÕES
CREATE TABLE public.allocations (
    id TEXT PRIMARY KEY,
    space_id TEXT REFERENCES public.spaces(id) ON DELETE CASCADE,
    teacher TEXT NOT NULL,
    class_name TEXT NOT NULL,
    students_count INT NOT NULL,
    date DATE NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 5. TABELA DE OCORRÊNCIAS TÉCNICAS
CREATE TABLE public.occurrences (
    id TEXT PRIMARY KEY,
    space_id TEXT REFERENCES public.spaces(id) ON DELETE CASCADE,
    space_name TEXT NOT NULL,
    failure_type TEXT NOT NULL,
    priority TEXT NOT NULL, -- Baixa | Média | Alta
    description TEXT,
    status TEXT DEFAULT 'ABERTO', -- ABERTO | EM_ANDAMENTO | RESOLVIDO
    created_at TEXT NOT NULL,
    reported_by TEXT NOT NULL,
    target_department TEXT NOT NULL
);

-- 6. TABELA DE AUDITORIA DE E-MAILS (NOTIFICAÇÕES GMAIL)
CREATE TABLE public.audit_logs (
    id TEXT PRIMARY KEY,
    occurrence_id TEXT REFERENCES public.occurrences(id) ON DELETE CASCADE,
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    priority_badge TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    snippet TEXT,
    full_body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- HABILITAR SEGURANÇA RLS (ROW LEVEL SECURITY) COM ACESSO PÚBLICO SIMPLIFICADO
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura e escrita publica em spaces" ON public.spaces FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir leitura e escrita publica em classes" ON public.classes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir leitura e escrita publica em collaborators" ON public.collaborators FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir leitura e escrita publica em allocations" ON public.allocations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir leitura e escrita publica em occurrences" ON public.occurrences FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir leitura e escrita publica em audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- POPULAR DADOS INICIAIS (SEED)
-- ============================================================

-- Inserir Espaços
INSERT INTO public.spaces (id, name, type, capacity, block, status, svg_group_id, desk_type) VALUES
('sala-01', 'Sala de Aula 01', 'Sala de Aula', 30, 'Bloco A', 'LIVRE', 'room-101', 'Individual'),
('sala-02', 'Sala de Aula 02', 'Sala de Aula', 30, 'Bloco A', 'LIVRE', 'room-102', 'Individual'),
('sala-03', 'Sala de Aula 03', 'Sala de Aula', 30, 'Bloco A', 'LIVRE', 'room-103', 'Individual'),
('sala-04', 'Sala de Aula 04', 'Sala de Aula', 30, 'Bloco B', 'LIVRE', 'room-201', 'Individual'),
('sala-05', 'Sala de Aula 05', 'Sala de Aula', 30, 'Bloco B', 'LIVRE', 'room-202', 'Individual'),
('sala-06', 'Sala de Aula 06', 'Sala de Aula', 30, 'Bloco B', 'LIVRE', 'room-203', 'Individual'),
('lab-info', 'Laboratório de Informática', 'Laboratório', 30, 'Bloco A', 'LIVRE', 'room-lab-info', 'Grupo'),
('lab-ciencias', 'Laboratório de Ciências', 'Laboratório', 30, 'Bloco A', 'LIVRE', 'room-lab-ciencias', 'Grupo'),
('quadra', 'Quadra Poliesportiva', 'Esporte / Lazer', 60, 'Bloco B', 'LIVRE', 'room-sports', 'Grupo'),
('teatro', 'Teatro Escola', 'Auditório / Eventos', 80, 'Bloco B', 'LIVRE', 'room-theater', 'Grupo'),
('biblioteca', 'Biblioteca Central', 'Biblioteca', 40, 'Bloco A', 'LIVRE', 'room-library', 'Grupo'),
('auditorio', 'Auditório Principal', 'Auditório / Eventos', 100, 'Bloco B', 'LIVRE', 'room-auditorium', 'Grupo');

-- Inserir Turmas
INSERT INTO public.classes (id, name, students_count) VALUES
('class-1', '1º TDS - Técnico em Des. de Sistemas', 28),
('class-2', '2º MA - Meio Ambiente', 25),
('class-3', '3º ME - Mecânica Industrial', 30),
('class-4', '1º Ano - Ensino Médio', 32),
('class-5', '2º Ano - Ensino Médio', 30),
('class-6', '3º Ano - Ensino Médio', 26);

-- Inserir Colaboradores
INSERT INTO public.collaborators (id, initials, name, status, category, role, email, phone, start_time, end_time, work_days, notes) VALUES
('col-1', 'FG', 'Prof. Filipe Guimarães', 'PRESENTE', 'Docente', 'Professor de Tecnologia & Programação', 'filipe.guimaraes@reflow.edu.br', '(11) 98765-4321', '07:30', '17:00', ARRAY['Seg','Ter','Qua','Qui','Sex'], 'Coordenador do curso de Tecnologia'),
('col-2', 'RV', 'Profa. Regina Vasconcellos', 'PRESENTE', 'Docente', 'Professora de Química & Ciências', 'regina.vasconcellos@reflow.edu.br', '(11) 97654-3210', '07:30', '13:00', ARRAY['Seg','Ter','Qua','Sex'], 'Responsável pelo Lab. de Ciências'),
('col-3', 'MA', 'Marcio Alves', 'PRESENTE', 'Suporte', 'Técnico em Manutenção Predial & TI', 'marcio.alves@reflow.edu.br', '(11) 96543-2109', '08:00', '17:00', ARRAY['Seg','Ter','Qua','Qui','Sex'], 'Equipe de TI e Manutenção'),
('col-4', 'CL', 'Carla Lima', 'PRESENTE', 'Limpeza/Apoio', 'Supervisora de Serviços Gerais & Limpeza', 'carla.lima@reflow.edu.br', '(11) 95432-1098', '06:00', '15:00', ARRAY['Seg','Ter','Qua','Qui','Sex'], 'Equipe de Limpeza e Organização'),
('col-5', 'CS', 'Carlos Silva', 'PRESENTE', 'Direção', 'Diretor Escolar', 'carlos.silva@reflow.edu.br', '(11) 94321-0987', '08:00', '18:00', ARRAY['Seg','Ter','Qua','Qui','Sex'], 'Direção Geral da Escola Técnica');
