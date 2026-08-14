<!-- Mini Mundo - Reflow: Sistema de Gestão de Espaços Escolares -->

# MINI MUNDO — SISTEMA REFLOW

**INSTITUIÇÃO:** Escola Técnica  
**SISTEMA:** Reflow — Gestão Inteligente de Espaços Escolares, Ocorrências e Profissionais  

---

O sistema **Reflow** desenvolve e fornece uma plataforma web completa de gestão inteligente de espaços escolares, agendamentos e manutenção preventiva e corretiva, voltada para instituições de ensino como a **Escola Técnica**. O objetivo da plataforma é oferecer uma solução intuitiva, centralizada e de alta precisão que permita o acompanhamento em tempo real da ocupação das salas, automatize a comunicação de falhas de infraestrutura e otimize a alocação de turmas e colaboradores.

O sistema permite o **cadastro de colaboradores e profissionais**, incluindo professores, coordenadores, equipes de suporte e manutenção (TI, serviços gerais e limpeza) e administradores, cada um com **níveis de acesso (RBAC)** e permissões específicas. Esses usuários podem consultar a disponibilidade de ambientes, realizar reservas, registrar e acompanhar chamados técnicos, emitir relatórios de auditoria e gerenciar as turmas da instituição. A autenticação é realizada com segurança via **Supabase Auth**, oferecendo suporte a login por e-mail e senha, além de **login social via Google OAuth**.

As **turmas** escolares também são cadastradas no sistema com informações como nome da turma e quantidade de alunos matriculados. O sistema registra as alocações da grade horária e associa cada turma ao docente responsável e ao ambiente utilizado, garantindo a rastreabilidade completa e o controle de sobrelotação dos espaços.

Os **espaços escolares** cadastrados incluem salas de aula convencionais, laboratórios especializados (Química, Informática, Robótica), auditórios e áreas de apoio, divididos por **blocos** (Bloco A e Bloco B) e **pavimentos** (Térreo e 1º Andar). Cada espaço possui informações como nome, capacidade nominal de alunos, tipo de ambiente e status em tempo real (**LIVRE**, **OCUPADO** ou **MANUTENÇÃO**). A visualização espacial é realizada através de uma **planta baixa interativa (SVG)**, que altera suas cores dinamicamente e exibe um painel lateral de detalhes (**SpaceDrawer**) com as informações do espaço e da reserva atual ao ser selecionado. A plataforma conta ainda com uma **busca global inteligente**, que destaca visualmente no mapa o local pesquisado por nome de sala, código de turma ou professor.

O gerenciamento de **reservas de espaços** permite agendamentos pontuais com definição de data, horário inicial e final, turma e docente responsável. O sistema executa um algoritmo automático de **prevenção de choque de horários**, impedindo reservas duplicadas no mesmo ambiente, e emite um **alerta de capacidade física** caso o número de alunos supere a lotação máxima da sala.

Para a gestão de falhas de infraestrutura, o sistema possui a **central de ocorrências**, permitindo a abertura rápida de chamados via botão flutuante (FAB) ou pelo painel do espaço. As ocorrências são registradas com o **tipo de falha** (Projetor/AV, Ar-condicionado, Limpeza, Elétrica, Mobiliário ou Outros) e o **nível de prioridade** (Baixa, Média ou Alta). Quando uma ocorrência é registrada, o sistema emite um **alerta automático** e altera imediatamente o status da sala afetada para **MANUTENÇÃO**. Através de uma arquitetura orientada a eventos, o sistema realiza o **disparo de e-mails em HTML** diretamente para a caixa de entrada da equipe encarregada via integração com a **API oficial do Gmail (OAuth 2.0)**. O histórico dessas notificações é armazenado no log de **auditoria de e-mails (audit_logs)**, permitindo conferir o destinatário, assunto, data/hora e conteúdo do disparo.

Em sua construção técnica, a aplicação é desenvolvida combinando linguagens e tecnologias específicas para cada camada do sistema: o **JavaScript (ES6+) e JSX (React)** gerenciam a lógica de programação da interface, a reatividade em tempo real, estados globais e as integrações de API; o **HTML5** fornece a estrutura semântica da Single Page Application (SPA); o **CSS3 (Vanilla CSS)** é responsável pelo sistema de design (*Design System Reflow*), estilização visual, animações e layout responsivo; o **SQL (PostgreSQL)** é utilizado no backend (via Supabase) para estruturação das tabelas relacionais, consultas e políticas de segurança (**RLS - Row Level Security**); e o **SVG (Scalable Vector Graphics)** é empregado como linguagem vetorial interativa para a renderização gráfica e dinâmica da planta baixa dos edifícios.

Com essa estrutura, o sistema **Reflow** proporciona uma gestão integrada e eficaz de espaços escolares, agendamentos e ocorrências, ajudando a direção e o corpo docente a se organizarem melhor, tomarem decisões baseadas em dados em tempo real e aumentarem a eficiência operacional e o aproveitamento dos recursos da **Escola Técnica**.

