import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { DEFAULT_SPACES, DEFAULT_COLLABORATORS, DEFAULT_CLASSES } from './defaultData';
import { todayDateString } from '../utils/spaceStatus';

// -------------------------------------------------------------
// MAPEAMENTO DE LINHAS DO BANCO (snake_case) -> FORMATO DO APP (camelCase)
// -------------------------------------------------------------
// Extraídas como funções isoladas e exportadas porque são usadas tanto por
// loadInitialData() (carga única no mount) quanto pelo realtimeService (que
// recebe as mesmas linhas via Supabase Realtime e precisa converter do
// mesmo jeito pra fundir no estado local sem duplicar a lógica).

export function mapSpaceRow(sp) {
  const isLabOrAudit = sp.type?.toLowerCase().includes('lab') || sp.type?.toLowerCase().includes('audit');
  const defaultEquip = isLabOrAudit
    ? ['Projetor', 'Ar-condicionado', 'Lousa Digital', 'Computadores', 'Sistema de Som']
    : ['Projetor', 'Ar-condicionado', 'Lousa Digital'];
  const defaultDesk = isLabOrAudit ? 'Grupo' : 'Individual';

  const rawEquip = sp.equipments;
  const parsedEquip = Array.isArray(rawEquip)
    ? rawEquip
    : (typeof rawEquip === 'string' && rawEquip.startsWith('[') ? JSON.parse(rawEquip) : defaultEquip);

  return {
    id: String(sp.id),
    name: sp.name,
    type: sp.type,
    capacity: Number(sp.capacity) || 30,
    block: sp.block,
    status: sp.status || 'LIVRE',
    svgGroupId: sp.svg_group_id,
    equipments: parsedEquip && parsedEquip.length > 0 ? parsedEquip : defaultEquip,
    deskType: sp.desk_type || defaultDesk
  };
}

// Formato "flat" (usado pela lista `allocations` do App, consumida pelo
// Dashboard/Analytics).
export function mapAllocationRow(a) {
  return {
    id: String(a.id),
    spaceId: String(a.space_id),
    teacher: a.teacher,
    className: a.class_name,
    studentsCount: Number(a.students_count) || 0,
    date: a.date,
    startTime: a.start_time,
    endTime: a.end_time,
    createdAt: a.created_at,
    seriesId: a.series_id || null
  };
}

// Formato embutido em space.scheduleToday (nomes de campo diferentes do
// formato flat acima — convenção pré-existente, mantida aqui).
export function allocationToScheduleEntry(flatAlloc) {
  return {
    id: flatAlloc.id,
    teacher: flatAlloc.teacher,
    class: flatAlloc.className,
    students: flatAlloc.studentsCount,
    date: flatAlloc.date,
    startTime: flatAlloc.startTime,
    endTime: flatAlloc.endTime,
    seriesId: flatAlloc.seriesId
  };
}

export function mapOccurrenceRow(o) {
  return {
    id: String(o.id),
    spaceId: String(o.space_id),
    spaceName: o.space_name,
    failureType: o.failure_type,
    priority: o.priority,
    description: o.description,
    status: o.status,
    createdAt: o.created_at,
    resolvedAt: o.resolved_at || null,
    reportedBy: o.reported_by,
    reportedByUserId: o.reported_by_user_id || null,
    targetDepartment: o.target_department
  };
}

export function mapAuditLogRow(a) {
  return {
    id: String(a.id),
    occurrenceId: String(a.occurrence_id),
    to: a.to_email,
    subject: a.subject,
    priorityBadge: a.priority_badge,
    timestamp: a.timestamp,
    snippet: a.snippet,
    fullBody: a.full_body
  };
}

export function mapCollaboratorRow(c) {
  return {
    id: String(c.id),
    initials: c.initials,
    name: c.name,
    status: c.status || 'PRESENTE',
    category: c.category,
    role: c.role,
    email: c.email,
    phone: c.phone,
    startTime: c.start_time,
    endTime: c.end_time,
    workDays: c.work_days || [],
    notes: c.notes,
    userId: c.user_id || null,
    systemRole: c.system_role || 'Pendente',
    avatarUrl: c.avatar_url || null
  };
}

export function mapClassRow(cl) {
  return {
    id: String(cl.id),
    name: cl.name,
    studentsCount: Number(cl.students_count) || 30
  };
}

/**
 * Carrega os dados iniciais do Supabase ou usa os dados padrão (fallback) caso o banco esteja vazio ou inacessível.
 */
export async function loadInitialData() {
  if (!isSupabaseConfigured()) {
    console.warn('[Reflow] Supabase não configurado. Utilizando dados padrão locais.');
    return {
      spaces: DEFAULT_SPACES,
      collaborators: DEFAULT_COLLABORATORS,
      classes: DEFAULT_CLASSES,
      occurrences: [],
      auditLogs: [],
      allocations: []
    };
  }

  try {
    // 1. Carrega Espaços & Alocações
    const { data: dbSpaces, error: spacesErr } = await supabase.from('spaces').select('*');
    const { data: dbAllocations } = await supabase.from('allocations').select('*');

    // Mapeamento único de allocations — reaproveitado tanto pela lista flat
    // (usada pelo Dashboard/Analytics) quanto pelo scheduleToday embutido em
    // cada sala (formato já existente, mantido intacto abaixo).
    const allocationsFlat = (dbAllocations || []).map(mapAllocationRow);

    let spacesList = [];

    if (!spacesErr && dbSpaces && dbSpaces.length > 0) {
      spacesList = dbSpaces.map(sp => {
        const spaceAllocations = allocationsFlat
          .filter(a => a.spaceId === String(sp.id))
          .map(allocationToScheduleEntry);

        return {
          ...mapSpaceRow(sp),
          scheduleToday: spaceAllocations
        };
      });
    } else {
      // Fallback para salas padrão e sementeia no Supabase em segundo plano
      spacesList = DEFAULT_SPACES;
      seedSpacesIfEmpty();
    }

    // 2. Ocorrências
    const { data: dbOccurrences } = await supabase.from('occurrences').select('*');
    let occurrencesList = [];

    if (dbOccurrences && dbOccurrences.length > 0) {
      occurrencesList = dbOccurrences.map(mapOccurrenceRow);
    }

    // 3. Auditoria de E-mails
    const { data: dbAudit } = await supabase.from('audit_logs').select('*');
    let auditLogsList = [];

    if (dbAudit && dbAudit.length > 0) {
      auditLogsList = dbAudit.map(mapAuditLogRow);
    }

    // 4. Colaboradores
    const { data: dbCollaborators, error: colErr } = await supabase.from('collaborators').select('*');
    let collaboratorsList = [];

    if (!colErr && dbCollaborators && dbCollaborators.length > 0) {
      collaboratorsList = dbCollaborators.map(mapCollaboratorRow);
    } else {
      collaboratorsList = DEFAULT_COLLABORATORS;
      seedCollaboratorsIfEmpty();
    }

    // 5. Turmas
    const { data: dbClasses, error: classErr } = await supabase.from('classes').select('*');
    let classesList = [];

    if (!classErr && dbClasses && dbClasses.length > 0) {
      classesList = dbClasses.map(mapClassRow);
    } else {
      classesList = DEFAULT_CLASSES;
      seedClassesIfEmpty();
    }

    return {
      spaces: spacesList,
      collaborators: collaboratorsList,
      classes: classesList,
      occurrences: occurrencesList,
      auditLogs: auditLogsList,
      allocations: allocationsFlat
    };

  } catch (err) {
    console.error('[Reflow] Erro ao carregar dados do Supabase:', err);
    return {
      spaces: DEFAULT_SPACES,
      collaborators: DEFAULT_COLLABORATORS,
      classes: DEFAULT_CLASSES,
      occurrences: [],
      auditLogs: [],
      allocations: []
    };
  }
}

// -------------------------------------------------------------
// SEMENTES AUTOMÁTICAS (Caso o banco de dados esteja limpo)
// -------------------------------------------------------------
async function seedSpacesIfEmpty() {
  try {
    const spacesToInsert = DEFAULT_SPACES.map(sp => ({
      id: sp.id,
      name: sp.name,
      type: sp.type,
      capacity: sp.capacity,
      block: sp.block,
      status: sp.status,
      svg_group_id: sp.svgGroupId
    }));
    await supabase.from('spaces').upsert(spacesToInsert);
  } catch (e) {
    console.warn('[Reflow] Aviso ao popular tabela spaces:', e);
  }
}

async function seedCollaboratorsIfEmpty() {
  try {
    const colToInsert = DEFAULT_COLLABORATORS.map(c => ({
      id: c.id,
      initials: c.initials,
      name: c.name,
      status: c.status,
      category: c.category,
      role: c.role,
      email: c.email,
      phone: c.phone,
      start_time: c.startTime,
      end_time: c.endTime,
      work_days: c.workDays,
      notes: c.notes
    }));
    await supabase.from('collaborators').upsert(colToInsert);
  } catch (e) {
    console.warn('[Reflow] Aviso ao popular tabela collaborators:', e);
  }
}

async function seedClassesIfEmpty() {
  try {
    const classesToInsert = DEFAULT_CLASSES.map(cl => ({
      id: cl.id,
      name: cl.name,
      students_count: cl.studentsCount
    }));
    await supabase.from('classes').upsert(classesToInsert);
  } catch (e) {
    console.warn('[Reflow] Aviso ao popular tabela classes:', e);
  }
}

// -------------------------------------------------------------
// OPERAÇÕES DE AGENDAMENTO / ALOCAÇÃO
// -------------------------------------------------------------
export async function dbAddAllocation(allocData) {
  if (!isSupabaseConfigured()) return;
  const allocId = String(allocData.id || 'alloc-' + Date.now());
  const { error } = await supabase.from('allocations').insert({
    id: allocId,
    space_id: String(allocData.spaceId),
    teacher: allocData.teacher,
    class_name: allocData.class,
    students_count: Number(allocData.students),
    date: allocData.date,
    start_time: allocData.startTime,
    end_time: allocData.endTime,
    series_id: allocData.seriesId || null
  });

  if (error) {
    // 23P01 = exclusion_violation — a trava allocations_no_overlap barrou
    // um choque de horário (ex: duas pessoas confirmando ao mesmo tempo)
    if (error.code === '23P01') {
      throw new Error('Esse horário acabou de ser reservado por outra pessoa nesta sala. Escolha outro horário.');
    }
    throw error;
  }

  // O campo spaces.status é um flag manual/legado (também usado pra
  // "OCUPADO"/"MANUTENÇÃO" definidos à mão em ModalEditSpace) — só faz
  // sentido gravar OCUPADO aqui quando a alocação é de HOJE. Uma reserva
  // pra uma data futura não deve marcar a sala como ocupada hoje; o status
  // em tempo real por data/hora já é calculado corretamente no frontend
  // (getRealTimeStatus, em src/utils/spaceStatus.js).
  if (allocData.date === todayDateString()) {
    await supabase.from('spaces').update({ status: 'OCUPADO' }).eq('id', String(allocData.spaceId));
  }
}

export async function dbDeleteAllocation(allocId, spaceId) {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('allocations').delete().eq('id', String(allocId));
  if (error) throw error;

  if (spaceId) {
    // Só considera alocações de HOJE pra decidir se a sala volta a LIVRE —
    // uma alocação futura remanescente não deve manter a sala marcada
    // como ocupada no dia de hoje.
    const { data: remaining } = await supabase
      .from('allocations')
      .select('id')
      .eq('space_id', String(spaceId))
      .eq('date', todayDateString());
    if (!remaining || remaining.length === 0) {
      await supabase.from('spaces').update({ status: 'LIVRE' }).eq('id', String(spaceId));
    }
  }
}

/**
 * Cancela TODAS as ocorrências de uma reserva recorrente de uma vez —
 * um único DELETE por series_id (usa o índice parcial idx_allocations_series_id),
 * diferente de dbDeleteAllocation, que cancela só 1 ocorrência específica.
 * Reavalia o status LIVRE/OCUPADO de cada sala afetada depois de apagar.
 */
export async function dbDeleteAllocationSeries(seriesId, spaceIdsToRelease) {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('allocations').delete().eq('series_id', String(seriesId));
  if (error) throw error;

  for (const spaceId of (spaceIdsToRelease || [])) {
    // Só considera alocações de HOJE — ver comentário equivalente em
    // dbDeleteAllocation.
    const { data: remaining } = await supabase
      .from('allocations')
      .select('id')
      .eq('space_id', String(spaceId))
      .eq('date', todayDateString());
    if (!remaining || remaining.length === 0) {
      await supabase.from('spaces').update({ status: 'LIVRE' }).eq('id', String(spaceId));
    }
  }
}

// -------------------------------------------------------------
// OPERAÇÕES DE OCORRÊNCIAS & AUDITORIA
// -------------------------------------------------------------
export async function dbAddOccurrence(occData, auditData) {
  if (!isSupabaseConfigured()) return;
  const occId = String(occData.id || 'occ-' + Date.now());
  const { error } = await supabase.from('occurrences').insert({
    id: occId,
    space_id: String(occData.spaceId),
    space_name: occData.spaceName,
    failure_type: occData.failureType,
    priority: occData.priority,
    description: occData.description,
    status: occData.status,
    created_at: occData.createdAt,
    reported_by: occData.reportedBy,
    reported_by_user_id: occData.reportedByUserId || null,
    target_department: occData.targetDepartment
  });
  if (error) throw error;

  if (auditData) {
    const auditId = String(auditData.id || 'audit-' + Date.now());
    const { error: auditError } = await supabase.from('audit_logs').insert({
      id: auditId,
      occurrence_id: occId,
      to_email: auditData.to,
      subject: auditData.subject,
      priority_badge: auditData.priorityBadge,
      timestamp: auditData.timestamp,
      snippet: auditData.snippet,
      full_body: auditData.fullBody
    });
    if (auditError) throw auditError;
  }
}

/**
 * Atualiza o status de uma ocorrência (ex: ABERTO ⇄ RESOLVIDO).
 * Usado pela Equipe de Suporte para dar baixa ou reabrir um chamado.
 */
export async function dbUpdateOccurrenceStatus(occId, status) {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('occurrences').update({ status }).eq('id', String(occId));
  if (error) throw error;
}

/**
 * Apaga uma única ocorrência. A RLS só deixa isso passar pra Equipe de
 * Suporte (qualquer uma) ou para quem reportou aquela ocorrência
 * especificamente (comparando com auth.uid()).
 */
export async function dbDeleteOccurrence(occId) {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('occurrences').delete().eq('id', String(occId));
  if (error) throw error;
}

// -------------------------------------------------------------
// OPERAÇÕES DE TURMAS
// -------------------------------------------------------------
export async function dbAddClass(classData) {
  if (!isSupabaseConfigured()) return;
  const classId = String(classData.id || 'class-' + Date.now());
  const { error } = await supabase.from('classes').insert({
    id: classId,
    name: classData.name,
    students_count: Number(classData.studentsCount)
  });
  if (error) throw error;
}

export async function dbDeleteClass(classId) {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('classes').delete().eq('id', String(classId));
  if (error) throw error;
}

export async function dbUpdateClass(classData) {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('classes').update({
    name: classData.name,
    students_count: Number(classData.studentsCount)
  }).eq('id', String(classData.id));
  if (error) throw error;
}

// -------------------------------------------------------------
// OPERAÇÕES DE COLABORADORES
// -------------------------------------------------------------
export async function dbSaveCollaborator(colData) {
  if (!isSupabaseConfigured()) return;
  const colId = String(colData.id || 'col-' + Date.now());
  const { error } = await supabase.from('collaborators').upsert({
    id: colId,
    initials: colData.initials,
    name: colData.name,
    status: colData.status || 'PRESENTE',
    category: colData.category,
    role: colData.role,
    email: colData.email,
    phone: colData.phone,
    start_time: colData.startTime,
    end_time: colData.endTime,
    work_days: colData.workDays,
    notes: colData.notes
  });
  if (error) throw error;
}

export async function dbDeleteCollaborator(colId) {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('collaborators').delete().eq('id', String(colId));
  if (error) throw error;
}

/**
 * Atualiza o cargo do sistema (Pendente/Professor/Direção/Equipe de
 * Suporte/Administrador) de um colaborador — é a mesma coluna lida pelo
 * Custom Access Token Hook no login. A RLS + trigger no banco só deixam
 * isso passar quando quem está chamando é Administrador.
 */
export async function dbUpdateCollaboratorSystemRole(colId, newRole) {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase
    .from('collaborators')
    .update({ system_role: newRole })
    .eq('id', String(colId));
  if (error) throw error;
}

/**
 * Busca o registro de colaborador vinculado ao usuário logado (por
 * user_id), direto no banco — usado pra mostrar o cargo em tempo real em
 * "Meu Perfil" em vez de confiar só no claim do JWT (que só é renovado a
 * cada login/refresh de token, podendo ficar desatualizado por um tempo).
 */
export async function dbGetMyCollaboratorRecord(userId) {
  if (!isSupabaseConfigured() || !userId) return null;
  try {
    const { data, error } = await supabase
      .from('collaborators')
      .select('name, role, system_role, initials')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { name: data.name, role: data.role, systemRole: data.system_role, initials: data.initials };
  } catch (e) {
    console.error('[Reflow] Erro ao buscar cargo em tempo real no Supabase:', e);
    return null;
  }
}

/**
 * Verifica se o colaborador vinculado ao usuário logado ainda existe no
 * banco (por user_id) — usado pelo polling de logout automático em App.jsx,
 * que desloga a sessão se a conta foi excluída por um Administrador/Direção.
 *
 * Diferente de dbGetMyCollaboratorRecord, distingue explicitamente "linha
 * não encontrada" (exists: false) de "erro ao consultar" (exists: null) —
 * um erro transitório de rede nunca deve ser interpretado como "conta
 * excluída" e forçar um logout indevido.
 */
export async function dbCheckCollaboratorExists(userId) {
  if (!isSupabaseConfigured() || !userId) return { exists: null };
  const { data, error } = await supabase
    .from('collaborators')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    console.error('[Reflow] Erro ao verificar se a conta ainda existe:', error);
    return { exists: null };
  }
  return { exists: !!data };
}

// -------------------------------------------------------------
// OPERAÇÕES DE ESPAÇOS / SALAS
// -------------------------------------------------------------
export async function dbUpdateSpaceStatus(spaceId, status) {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('spaces').update({ status }).eq('id', String(spaceId));
  if (error) throw error;
}

export async function dbUpdateSpaceFeatures(spaceId, { equipments, deskType }) {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('spaces').update({
    equipments,
    desk_type: deskType
  }).eq('id', String(spaceId));
  if (error) throw error;
}

export async function dbUpdateSpace(spaceData) {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('spaces').update({
    name: spaceData.name,
    type: spaceData.type,
    capacity: Number(spaceData.capacity),
    block: spaceData.block,
    status: spaceData.status,
    equipments: spaceData.equipments,
    desk_type: spaceData.deskType
  }).eq('id', String(spaceData.id));
  if (error) throw error;
}

export async function dbClearHistory() {
  if (!isSupabaseConfigured()) return;
  const { error: occError } = await supabase.from('occurrences').delete().neq('id', '0');
  if (occError) throw occError;
  const { error: auditError } = await supabase.from('audit_logs').delete().neq('id', '0');
  if (auditError) throw auditError;
}

/**
 * Busca o log de auditoria administrativa (troca de cargo, exclusão de
 * ocorrência, edição/exclusão de sala). Populado só por triggers
 * SECURITY DEFINER no banco (nunca por insert daqui) — ver migration
 * 20260815000000_admin_audit_log.sql. RLS restringe o SELECT a is_admin(),
 * então para qualquer outro cargo a query volta vazia, sem erro. Não faz
 * parte de "Limpar Histórico" — é imutável por design.
 */
export async function dbGetAdminAuditLog(limit = 200) {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from('admin_audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('[Reflow] Erro ao buscar log de auditoria administrativa:', error);
    return [];
  }
  return (data || []).map(l => ({
    id: l.id,
    actorUserId: l.actor_user_id,
    action: l.action,
    targetTable: l.target_table,
    targetId: l.target_id,
    targetLabel: l.target_label,
    oldData: l.old_data,
    newData: l.new_data,
    createdAt: l.created_at
  }));
}

// -------------------------------------------------------------
// LIBERAÇÃO AUTOMÁTICA DE SALAS (Alocações Expiradas)
// -------------------------------------------------------------
/**
 * Remove alocações expiradas do banco de dados e atualiza o status
 * dos espaços para 'LIVRE' quando não houver mais alocações ativas.
 * @param {string[]} expiredAllocIds - IDs das alocações expiradas
 * @param {string[]} spaceIdsToRelease - IDs dos espaços que devem ser liberados
 */
export async function dbReleaseExpiredAllocations(expiredAllocIds, spaceIdsToRelease) {
  if (!isSupabaseConfigured()) return;
  try {
    // 1. Deleta cada alocação expirada
    for (const allocId of expiredAllocIds) {
      await supabase.from('allocations').delete().eq('id', String(allocId));
    }

    // 2. Para cada espaço, verifica se ainda tem alocações restantes HOJE
    //    (uma alocação futura remanescente não deve manter a sala ocupada
    //    hoje — ver comentário equivalente em dbDeleteAllocation)
    for (const spaceId of spaceIdsToRelease) {
      const { data: remaining } = await supabase
        .from('allocations')
        .select('id')
        .eq('space_id', String(spaceId))
        .eq('date', todayDateString());

      if (!remaining || remaining.length === 0) {
        await supabase.from('spaces').update({ status: 'LIVRE' }).eq('id', String(spaceId));
        console.log(`[Reflow] 🔓 Sala ${spaceId} liberada automaticamente no banco de dados.`);
      }
    }
  } catch (e) {
    console.error('[Reflow] Erro ao liberar alocações expiradas no Supabase:', e);
  }
}
