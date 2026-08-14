# DER — Diagrama de Entidade-Relacionamento do Sistema REFLOW

**Sistema:** Reflow — Gestão Inteligente de Espaços Escolares  
**Banco de Dados:** PostgreSQL (Supabase Cloud)  
**Data:** Agosto de 2026  

---

## Diagrama de Entidade-Relacionamento (DER)

![DER — Diagrama de Entidade-Relacionamento do Sistema Reflow](c:/Users/Mario/Downloads/Reflow-Trabalho(04-08-26)/projeto/DER-Reflow-gerado.png)

---

## 1. Descrição das Entidades

O banco de dados do sistema Reflow é composto por **6 entidades** que representam os objetos centrais do domínio de gestão escolar:

---

### 1.1. Espaços (`spaces`)

Representa cada ambiente físico da escola (salas de aula, laboratórios, auditórios, quadra, biblioteca).

| Atributo | Tipo | Descrição |
|---|---|---|
| **id** (PK) | TEXT | Identificador único do espaço (ex: `sala-01`, `lab-info`) |
| name | TEXT | Nome completo do espaço (ex: "Sala de Aula 01") |
| type | TEXT | Tipo do espaço (Sala de Aula, Laboratório, Auditório, Biblioteca, Esporte) |
| capacity | INT | Capacidade máxima de alunos |
| block | TEXT | Bloco do prédio (Bloco A ou Bloco B) |
| status | TEXT | Estado atual: `LIVRE` \| `OCUPADO` \| `MANUTENCAO` |
| svg_group_id | TEXT | ID do grupo SVG no mapa interativo da planta baixa |
| equipments | JSONB | Lista de equipamentos (Projetor, Ar-condicionado, Lousa Digital, etc.) |
| desk_type | TEXT | Tipo de mobiliário (Individual ou Grupo) |

---

### 1.2. Turmas (`classes`)

Representa cada turma cadastrada na instituição.

| Atributo | Tipo | Descrição |
|---|---|---|
| **id** (PK) | TEXT | Identificador único da turma (ex: `class-1`) |
| name | TEXT | Nome da turma (ex: "1º TDS - Técnico em Des. de Sistemas") |
| students_count | INT | Quantidade total de alunos matriculados |

---

### 1.3. Colaboradores (`collaborators`)

Representa os profissionais da escola (docentes, equipe de suporte, limpeza, direção).

| Atributo | Tipo | Descrição |
|---|---|---|
| **id** (PK) | TEXT | Identificador único do colaborador (ex: `col-1`) |
| initials | TEXT | Iniciais do nome (ex: "FG") |
| name | TEXT | Nome completo (ex: "Prof. Filipe Guimarães") |
| status | TEXT | Situação atual: `PRESENTE` \| `AUSENTE` |
| category | TEXT | Categoria funcional (Docente, Suporte, Limpeza/Apoio, Direção) |
| role | TEXT | Função/cargo descritivo (ex: "Professor de Tecnologia & Programação") |
| email | TEXT | E-mail institucional |
| phone | TEXT | Telefone de contato |
| start_time | TEXT | Horário de início da jornada (formato HH:MM) |
| end_time | TEXT | Horário de fim da jornada (formato HH:MM) |
| work_days | TEXT[] | Array de dias de trabalho (ex: ['Seg','Ter','Qua','Qui','Sex']) |
| notes | TEXT | Observações adicionais |

---

### 1.4. Alocações (`allocations`)

Representa cada reserva/agendamento de um espaço por uma turma em um horário específico.

| Atributo | Tipo | Descrição |
|---|---|---|
| **id** (PK) | TEXT | Identificador único da alocação (ex: `alloc-1723...`) |
| space_id (FK) | TEXT | Referência ao espaço reservado → `spaces.id` |
| teacher | TEXT | Nome do professor responsável pela reserva |
| class_name | TEXT | Nome da turma alocada |
| students_count | INT | Quantidade de alunos presentes |
| date | DATE | Data da reserva (formato YYYY-MM-DD) |
| start_time | TEXT | Horário de início (formato HH:MM) |
| end_time | TEXT | Horário de término (formato HH:MM) |
| created_at | TIMESTAMPTZ | Data/hora de criação do registro |

---

### 1.5. Ocorrências (`occurrences`)

Representa cada chamado técnico ou incidente registrado em um espaço.

| Atributo | Tipo | Descrição |
|---|---|---|
| **id** (PK) | TEXT | Identificador único da ocorrência (ex: `occ-1723...`) |
| space_id (FK) | TEXT | Referência ao espaço afetado → `spaces.id` |
| space_name | TEXT | Nome do espaço (desnormalizado para exibição rápida) |
| failure_type | TEXT | Tipo de falha (Projetor/AV, Ar-condicionado, Limpeza, Elétrica, etc.) |
| priority | TEXT | Nível de prioridade: `Baixa` \| `Média` \| `Alta` |
| description | TEXT | Descrição detalhada do problema |
| status | TEXT | Estado do chamado: `ABERTO` \| `EM_ANDAMENTO` \| `RESOLVIDO` |
| created_at | TEXT | Horário de abertura do chamado |
| reported_by | TEXT | Nome do colaborador que registrou |
| target_department | TEXT | E-mail do departamento destinatário do alerta |

---

### 1.6. Auditoria de E-mails (`audit_logs`)

Representa cada registro de disparo de notificação por e-mail associado a uma ocorrência.

| Atributo | Tipo | Descrição |
|---|---|---|
| **id** (PK) | TEXT | Identificador único do log (ex: `audit-1723...`) |
| occurrence_id (FK) | TEXT | Referência à ocorrência origem → `occurrences.id` |
| to_email | TEXT | E-mail do destinatário |
| subject | TEXT | Assunto do e-mail enviado |
| priority_badge | TEXT | Badge de prioridade (URGENTE, MÉDIA, BAIXA) |
| timestamp | TEXT | Horário do disparo |
| snippet | TEXT | Resumo do conteúdo do e-mail |
| full_body | TEXT | Corpo completo do e-mail enviado |
| created_at | TIMESTAMPTZ | Data/hora de criação do registro |

---

## 2. Relacionamentos

| Nº | Entidade A | Relacionamento | Entidade B | Cardinalidade | Descrição |
|---|---|---|---|---|---|
| 1 | **Espaços** | ◇ Possui | **Alocações** | (1,n) → (1,1) | Um espaço pode ter várias alocações; cada alocação pertence a um único espaço |
| 2 | **Espaços** | ◇ Registra | **Ocorrências** | (1,n) → (1,1) | Um espaço pode ter várias ocorrências; cada ocorrência é vinculada a um único espaço |
| 3 | **Ocorrências** | ◇ Gera | **Auditoria de E-mails** | (1,n) → (1,1) | Uma ocorrência pode gerar vários logs de auditoria; cada log pertence a uma única ocorrência |
| 4 | **Turmas** | ◇ Alocada em | **Alocações** | (1,n) → (1,1) | Uma turma pode aparecer em várias alocações ao longo do tempo |
| 5 | **Colaboradores** | ◇ Reporta | **Ocorrências** | (1,n) → (0,n) | Um colaborador pode registrar várias ocorrências; uma ocorrência é reportada por um colaborador |

---

## 3. Integridade Referencial (Foreign Keys)

```sql
-- Alocações → Espaços (ON DELETE CASCADE)
allocations.space_id  →  spaces.id

-- Ocorrências → Espaços (ON DELETE CASCADE)
occurrences.space_id  →  spaces.id

-- Auditoria → Ocorrências (ON DELETE CASCADE)
audit_logs.occurrence_id  →  occurrences.id
```

> [!IMPORTANT]
> Todas as chaves estrangeiras utilizam `ON DELETE CASCADE`, garantindo que ao excluir um espaço, todas as suas alocações e ocorrências vinculadas são automaticamente removidas, e ao excluir uma ocorrência, seus logs de auditoria também são eliminados.

---

## 4. Segurança (Row Level Security)

Todas as 6 tabelas possuem **RLS (Row Level Security)** habilitado com política de acesso público simplificado para leitura e escrita, adequado ao contexto de ambiente escolar interno com autenticação via Supabase Auth (Google OAuth).
