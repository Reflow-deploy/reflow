# LEVANTAMENTO DE DADOS

---

**FECIP – 2026**

**REFLOW**

---

**Filipe Guimarães Damião**

**Orientador: Márcio José**

Levantamento de dados apresentado ao curso de informática como requisito para obtenção de nota de avaliação em conjunto (FECIP).

---

Rio de Janeiro, RJ – Brasil
2026

---

## INTRODUÇÃO

O Reflow tem como objetivo otimizar a gestão de espaços escolares de instituições de ensino técnico, oferecendo controle em tempo real da ocupação de salas e laboratórios, agendamento inteligente com prevenção de choques de horários, registro e encaminhamento automático de ocorrências de infraestrutura, e centralização do cadastro de turmas e colaboradores. O sistema busca aumentar a eficiência operacional e melhorar ao máximo a experiência dos usuários da comunidade escolar com a administração dos ambientes da instituição.

---

## DEFINIÇÕES DO PROJETO

### Área

O projeto atua na área de gestão escolar e administrativa, com foco em controle de ocupação de espaços físicos, agendamento de reservas e gestão de ocorrências de manutenção e suporte técnico. O Reflow proporciona uma ferramenta completa de organização institucional, trazendo benefícios para escolas técnicas que buscam automatizar processos, reduzir conflitos de agendamento e melhorar a comunicação entre equipes.

### Objetivo

Desenvolver e implementar uma plataforma web inteligente de gestão de espaços escolares que proporcione maior organização, eficiência e visibilidade em tempo real para a administração da Escola Técnica. O sistema visa eliminar choques de horários nas reservas, automatizar o encaminhamento de falhas de infraestrutura por e-mail, centralizar o cadastro de profissionais e turmas e, consequentemente, aumentar a produtividade e a qualidade operacional da instituição.

### Funcionamento

**Administrador / Direção:** Terá acesso a todas as funcionalidades do sistema. Ele poderá cadastrar novos espaços, definir capacidades e equipamentos de cada sala, visualizar a planta baixa interativa com o status em tempo real de todos os ambientes, e gerenciar o quadro completo de colaboradores e turmas. Também será possível consultar o histórico de ocorrências, acessar os logs de auditoria de e-mails disparados e realizar operações de limpeza de histórico. Além disso, o administrador poderá criar e gerenciar contas de outros usuários, definindo níveis de acesso por cargo (RBAC).

**Professor / Coordenador:** Poderá consultar a ocupação dos espaços em tempo real ou em datas futuras através do mapa interativo, realizar reservas pontuais de salas, laboratórios e auditórios, e registrar ocorrências de infraestrutura identificadas nos ambientes. O sistema facilitará o trabalho docente, pois permitirá que o professor localize turmas e salas rapidamente pela busca global, verifique a disponibilidade antes de reservar e receba confirmação instantânea do agendamento.

**Equipe de Suporte (TI / Limpeza):** Receberá notificações automáticas por e-mail (via Gmail API) sobre novos chamados abertos, contendo detalhes como o espaço afetado, tipo de falha, prioridade e descrição. Também poderá acompanhar o painel geral de ocorrências e atualizar o status de resolução dos problemas (Aberto → Resolvido).

**Comunidade Escolar (Alunos e Visitantes):** Embora não acesse diretamente as funcionalidades administrativas, poderá utilizar a busca global e a planta baixa interativa para localizar turmas, salas e professores na instituição.

**Sistema (automatizações):** O sistema realiza verificações automáticas a cada 10 segundos para liberar salas com alocações expiradas, atualiza dinamicamente o status dos espaços (LIVRE / OCUPADO / MANUTENÇÃO) e dispara e-mails HTML estilizados para as equipes responsáveis sempre que uma ocorrência é registrada. Tudo isso torna a gestão mais proativa, eficiente e baseada em dados reais.

### Sistemas Aplicáveis

Tratando-se de uma plataforma web de gestão escolar, o Reflow pode ser utilizado em notebooks, computadores e dispositivos com navegador web moderno (Chrome, Edge, Firefox, Safari) com acesso à internet. O sistema foi desenvolvido com base nas tecnologias **React (JavaScript/JSX)**, **Vite**, **Supabase (PostgreSQL + Auth)** e **Gmail API OAuth 2.0**, permitindo uma aplicação leve, responsiva e de fácil navegação. Por ser um sistema que exige baixo consumo de recursos, recomenda-se utilizá-lo em máquinas com processador Intel Core i3 ou superior, 4 GB de memória RAM e conexão estável de internet.

---

## DESCRIÇÃO DO SISTEMA

### Mapa Interativo e Planta Baixa (SVG)

Representação gráfica vetorial dos edifícios da escola organizada por bloco (Bloco A e Bloco B) e pavimento (Térreo e 1º Andar). Cada sala, laboratório, auditório e espaço esportivo é renderizado como um elemento SVG clicável, com cores dinâmicas que indicam o status atual: **LIVRE** (verde), **OCUPADO** (azul/bordô) e **MANUTENÇÃO** (laranja). Ao selecionar um espaço, um painel lateral (SpaceDrawer) se abre exibindo nome, tipo, capacidade, bloco, equipamentos disponíveis, tipo de mobiliário e detalhes da reserva atual ou próxima reserva programada.

### Sistema de Busca e Localizador Global

Ferramenta de busca rápida integrada ao cabeçalho da aplicação, permitindo localizar salas, turmas ou professores pelo nome. Ao buscar, o sistema destaca visualmente no mapa o espaço correspondente com um efeito de pulso animado, direcionando a atenção do usuário.

### Gestão de Reservas e Agendamentos

Formulário de reserva acessível pelo painel do espaço, com campos para seleção de data, horário inicial e final, professor responsável, turma e quantidade de alunos. O sistema executa um algoritmo automático de prevenção de choque de horários que impede reservas duplicadas no mesmo ambiente e alerta caso a quantidade de alunos exceda a capacidade máxima da sala. A alocação altera imediatamente o status do espaço para OCUPADO e é registrada no banco de dados Supabase.

### Central de Ocorrências e Disparo de Alertas

Módulo central para registro e acompanhamento de chamados técnicos de infraestrutura. Acessível pelo botão flutuante (FAB) ou pelo painel do espaço, permite categorizar o problema (Projetor/AV, Ar-condicionado, Limpeza, Elétrica, Mobiliário, Outros), definir a prioridade (Baixa, Média, Alta) e descrever os detalhes. Ao registrar, o sistema dispara automaticamente um e-mail HTML formatado para a equipe responsável via integração com a API oficial do Gmail (OAuth 2.0), e registra o envio no log de auditoria.

### Gestão de Profissionais e Colaboradores

Cadastro completo de colaboradores com nome, iniciais, categoria funcional (Docente, Suporte, Limpeza/Apoio, Direção), cargo, e-mail institucional, telefone, horário de jornada, dias de atuação e observações. Permite adição, edição e exclusão de registros com persistência no Supabase.

### Gestão de Turmas Escolares

Cadastro de turmas com nome e quantidade de alunos matriculados. As turmas são utilizadas como referência nos formulários de reserva e no controle de alocações.

### Auditoria de E-mails e Logs

Painel de consulta do histórico completo de notificações enviadas por e-mail, contendo o destinatário, assunto, badge de prioridade, horário do disparo, resumo e corpo completo da mensagem. Permite rastreabilidade total de cada comunicação realizada pelo sistema.

### Autenticação e Controle de Acesso

Sistema de login seguro via Supabase Auth com suporte a autenticação por e-mail/senha e login social com Google OAuth 2.0. O usuário pode alterar seu cargo ativo no sistema (Administrador, Professor, Suporte, Visitante) para ajustar as permissões de acesso (RBAC).

---

## FUNÇÃO DOS SISTEMAS

### Controle de Ocupação em Tempo Real

Permite o monitoramento contínuo do status de todos os espaços da escola. O sistema verifica automaticamente a cada 10 segundos se existem alocações expiradas e libera os espaços correspondentes, atualizando tanto o estado local da interface quanto o banco de dados. Isso garante que a planta baixa sempre reflita a situação real dos ambientes.

### Alerta Automático de Ocorrências por E-mail

Sempre que uma ocorrência técnica é registrada, o sistema emite uma notificação automatizada por e-mail diretamente para a caixa de entrada da equipe de suporte ou limpeza. O e-mail possui template HTML profissional com informações do espaço afetado, tipo de falha, prioridade, solicitante e descrição do problema. O sistema possui duplo motor de envio: primeiro tenta via API oficial do Gmail (OAuth 2.0), com fallback automático para o motor FormSubmit.

### Prevenção de Choque de Horários

O sistema executa uma validação automática para garantir que não existam reservas sobrepostas para o mesmo espaço no mesmo período. Além disso, verifica se a turma já está alocada em outra sala no mesmo horário, evitando duplicidades no uso dos ambientes.

### Busca Inteligente com Destaque Visual

A busca global permite localizar qualquer espaço, turma ou professor pelo nome. Ao encontrar o resultado, o sistema destaca visualmente a sala correspondente no mapa SVG com um efeito de pulso animado, facilitando a localização física do ambiente.

### Programa de Auditoria e Rastreabilidade

Cada ação de disparo de e-mail gera um registro de auditoria contendo destinatário, assunto, conteúdo completo, prioridade e horário. O administrador pode consultar o histórico completo, reenviar alertas e limpar o histórico quando necessário.

### Liberação Automática de Espaços

O sistema monitora continuamente as alocações ativas e, ao detectar que o horário final de uma reserva foi ultrapassado, remove automaticamente a alocação e altera o status da sala para LIVRE, tanto na interface quanto no banco de dados Supabase.

---

## EXEMPLO DE TELAS

### Tela de Login

Tela de autenticação com campos de e-mail e senha, botão de login social com Google OAuth e logotipo do sistema Reflow. Background com temática escolar e design premium.

### Planta Baixa Interativa

Visualização do mapa SVG com todos os espaços da escola organizados por bloco e andar. Salas livres em verde, ocupadas em azul/bordô e em manutenção em laranja. Sidebar de navegação à esquerda e cabeçalho com busca e relógio.

### Painel de Espaço (SpaceDrawer)

Painel lateral com informações detalhadas do espaço selecionado: nome, tipo, capacidade, bloco, equipamentos, mobiliário, status atual e dados da reserva ativa ou próxima programada. Botões para reservar e reportar ocorrência.

### Formulário de Reserva

Modal com campos de data, horário inicial e final, professor responsável, turma e número de alunos. Validações automáticas de choque de horário e capacidade máxima.

### Cadastro de Colaborador

Modal com campos para iniciais, nome completo, categoria, cargo, e-mail, telefone, horário de jornada, dias de atuação e observações.

### Central de Ocorrências

Painel com lista de chamados abertos, filtros por departamento, botão de resolução e aba de auditoria de e-mails. Conexão com Gmail API para disparo de alertas.

### Gestão de Turmas

Lista de turmas cadastradas com nome e quantidade de alunos. Botões para adicionar, editar e remover turmas.

---

## DFD 0 (Diagrama de Fluxo de Dados de Nível 0)

*Consultar o documento:* **DFD-Nivel-0.md** e a imagem **DFD-0-Reflow-gerado.png** na pasta `projeto/`.

---

## DER (Diagrama de Entidade e Relacionamento)

*Consultar o documento:* **DER-Reflow.md** e a imagem **DER-Reflow-gerado.png** na pasta `projeto/`.

---

## VIABILIDADE

No quesito viabilidade do projeto, o sistema Reflow será proposto para instituições de ensino técnico e profissionalizante, especialmente aquelas que enfrentam dificuldades em organizar e monitorar seus espaços físicos de forma eficiente. A escolha desse público-alvo se baseia na alta demanda por soluções acessíveis e intuitivas nesse segmento, onde muitas vezes não há investimento suficiente em sistemas profissionais de gestão de infraestrutura escolar.

Do ponto de vista financeiro, o projeto foi pensado para ter baixo custo de desenvolvimento e operação, utilizando ferramentas de código aberto e serviços gratuitos no tier inicial: **React** (licença MIT) como framework de interface, **Vite** como bundler de alta performance, **Supabase** (tier gratuito com PostgreSQL e autenticação) como backend-as-a-service e **Gmail API** (cota gratuita de envio) para notificações. Isso permite um desenvolvimento rápido e econômico, sem comprometer a qualidade e a funcionalidade do sistema.

Além disso, por ser uma aplicação web leve e adaptável, o Reflow pode ser utilizado tanto localmente (em computadores e notebooks com navegador web) quanto em versões online hospedadas na nuvem (Vercel, Netlify), dependendo da estrutura da instituição. Essa flexibilidade torna possível atender diferentes realidades, desde escolas com infraestrutura básica até instituições com maior capacidade tecnológica.

Visando democratizar o acesso, o sistema pode ser disponibilizado de forma gratuita para instituições públicas de ensino, e futuramente poderá ser adaptado com planos personalizados para escolas de maior porte com funcionalidades avançadas como relatórios analíticos, integração com sistemas de ponto e geração de dashboards de utilização.

A princípio, o foco está voltado ao setor educacional público e técnico, onde há maior necessidade de modernização administrativa. Futuramente, o sistema poderá ser adaptado e oferecido em parceria com secretarias de educação, cooperativas de ensino ou programas de apoio à inovação tecnológica escolar. Dessa forma, o Reflow busca equilibrar inovação tecnológica com acessibilidade, contribuindo para a profissionalização e o crescimento sustentável da gestão escolar.
