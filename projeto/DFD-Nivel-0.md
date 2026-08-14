# DFD Nível 0 — Diagrama de Contexto do Sistema REFLOW

**Sistema:** Reflow — Gestão Inteligente de Espaços Escolares  
**Instituição:** Escola Técnica  
**Data:** Agosto de 2026  

---

## Diagrama de Contexto (DFD Nível 0)

![DFD Nível 0 — Diagrama de Contexto do Sistema Reflow](c:/Users/Mario/Downloads/Reflow-Trabalho(04-08-26)/projeto/DFD-0-Reflow-gerado.png)

---

## Descrição do Diagrama

O DFD Nível 0 apresenta o **Sistema Reflow** como um **único processo central** que interage com **5 entidades externas**. O diagrama mostra todas as entradas (dados que o sistema recebe) e saídas (dados que o sistema produz) para cada ator ou serviço externo.

---

## Entidades Externas

| Nº | Entidade Externa | Descrição |
|---|---|---|
| 1 | **Professor / Coordenador** | Usuários que consultam espaços, realizam reservas e registram ocorrências |
| 2 | **Administrador / Direção** | Gestores com acesso total ao cadastro de colaboradores, turmas, edição de salas e backup |
| 3 | **Equipe de Suporte (TI / Limpeza)** | Técnicos e equipe de serviços gerais que recebem alertas e atualizam status de chamados |
| 4 | **Supabase (Banco de Dados)** | Serviço cloud de persistência (PostgreSQL) que armazena todos os dados do sistema |
| 5 | **Google Gmail API** | Serviço externo de e-mail para disparo real de alertas de ocorrências |

---

## Fluxos de Dados — Entradas (→ Sistema)

| Entidade de Origem | Fluxo de Dados | Descrição |
|---|---|---|
| **Professor / Coordenador** | Dados de Reserva | Sala, turma, professor responsável, data, horário inicial e final |
| **Professor / Coordenador** | Registro de Ocorrência | Tipo de falha, prioridade, descrição, espaço afetado, e-mail destinatário |
| **Professor / Coordenador** | Consulta / Busca de Espaços | Termo de busca por nome de sala, turma ou professor |
| **Administrador / Direção** | Cadastro de Colaboradores | Nome, função, e-mail, telefone, jornada de trabalho, dias de atuação |
| **Administrador / Direção** | Cadastro de Turmas | Nome da turma, quantidade de alunos |
| **Administrador / Direção** | Edição de Espaços | Nome, tipo, capacidade, bloco, equipamentos, tipo de mobiliário, status |
| **Administrador / Direção** | Comando de Backup / Limpeza | Solicitação de limpeza de histórico de ocorrências e auditoria |
| **Equipe de Suporte** | Atualização de Status | Resolução de ocorrência (marcar como resolvida) |
| **Supabase** | Dados Persistidos | Espaços, alocações, colaboradores, turmas, ocorrências e logs de auditoria |
| **Google Gmail API** | Token OAuth 2.0 | Access Token do Google Identity Services para autenticação de envio |

---

## Fluxos de Dados — Saídas (Sistema →)

| Entidade de Destino | Fluxo de Dados | Descrição |
|---|---|---|
| **Professor / Coordenador** | Status em Tempo Real | Estado atualizado de cada sala (LIVRE / OCUPADO / MANUTENÇÃO) via cálculo a cada 60s |
| **Professor / Coordenador** | Confirmação de Reserva | Toast de confirmação com validação de choque de horários |
| **Professor / Coordenador** | Mapa Interativo (SVG) | Planta baixa com destaque visual de cores por status de ocupação |
| **Administrador / Direção** | Relatórios e Logs de Auditoria | Histórico de e-mails disparados com detalhes de remetente, destinatário e conteúdo |
| **Administrador / Direção** | Lista de Colaboradores e Turmas | Dados cadastrados de profissionais e turmas com CRUD completo |
| **Equipe de Suporte** | Alerta de Ocorrência por E-mail | E-mail HTML formatado com detalhes da ocorrência (espaço, tipo, prioridade, descrição) |
| **Equipe de Suporte** | Painel de Ocorrências | Interface de visualização e filtragem de todos os chamados abertos |
| **Supabase** | CRUD (Insert / Update / Delete) | Operações de persistência em tabelas: spaces, allocations, collaborators, classes, occurrences, audit_logs |
| **Google Gmail API** | Mensagem MIME (RFC 2822) | E-mail codificado em Base64URL via endpoint `gmail.googleapis.com/v1/users/me/messages/send` |

---

## Processo Central

| Processo | Descrição |
|---|---|
| **SISTEMA REFLOW** | Plataforma web de gestão de espaços escolares que processa reservas de salas com validação de choques de horário, gerencia ocorrências de infraestrutura com disparo automático de e-mail, controla o cadastro de colaboradores e turmas, calcula o status de ocupação em tempo real e apresenta a planta baixa interativa da escola |

---

## Regras de Negócio Representadas no Diagrama

1. **Validação de Choque de Horários** — O sistema bloqueia reservas quando a mesma turma já está alocada em outro espaço no mesmo período.
2. **Liberação Automática** — Alocações expiradas são removidas automaticamente a cada 10 segundos, liberando o espaço no banco.
3. **Event-Driven de Ocorrências** — O registro de uma ocorrência dispara um evento interno (`OCCURRENCE_CREATED`) que aciona o serviço de e-mail e cria o log de auditoria simultaneamente.
4. **Duplo Motor de E-mail** — O sistema tenta primeiro o envio via API oficial do Gmail (OAuth), com fallback automático para o motor FormSubmit.
5. **Autenticação via Supabase Auth** — O acesso ao sistema exige login via provedor OAuth (Google) gerenciado pelo Supabase.
