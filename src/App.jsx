import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import FABAlert from './components/FABAlert';
import InteractiveMap from './components/InteractiveMap';
import SpaceDrawer from './components/SpaceDrawer';
import OccurrencesCenter from './components/OccurrencesCenter';
import SettingsModule from './components/SettingsModule';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import LoginScreen from './components/LoginScreen';
import AuthCallback from './components/AuthCallback';
import PendingApproval from './components/PendingApproval';
import { supabase } from './lib/supabaseClient';

import ModalReserveSpace from './components/modals/ModalReserveSpace';
import ModalReportOccurrence from './components/modals/ModalReportOccurrence';
import ModalAddCollaborator from './components/modals/ModalAddCollaborator';
import ModalAddClass from './components/modals/ModalAddClass';
import ModalSeriesResult from './components/modals/ModalSeriesResult';

import { getRealTimeStatus, todayDateString, timeToMinutes, nowInMinutes, nowTimeString } from './utils/spaceStatus';
import {
  loadInitialData,
  dbAddAllocation,
  dbDeleteAllocation,
  dbDeleteAllocationSeries,
  dbAddOccurrence,
  dbUpdateOccurrenceStatus,
  dbDeleteOccurrence,
  dbClearHistory,
  dbAddClass,
  dbDeleteClass,
  dbSaveCollaborator,
  dbDeleteCollaborator,
  dbUpdateSpaceStatus,
  dbUpdateCollaboratorSystemRole,
  dbUpdateSpaceFeatures,
  dbUpdateSpace,
  dbUpdateClass,
  dbReleaseExpiredAllocations,
  dbCheckCollaboratorExists,
  dbGetAdminAuditLog,
  allocationToScheduleEntry
} from './services/supabaseService';
import { subscribeToChanges } from './services/realtimeService';
import { eventService, EVENTS } from './services/eventService';
import { sendOccurrenceEmail } from './services/gmailService';
import { getAllowedTabs, ROLES } from './utils/permissions';
import { getRoleFromSession } from './utils/jwt';

// Reformatação pura de "YYYY-MM-DD" -> "DD/MM/YYYY", sem passar por
// new Date() (evita qualquer risco de fuso horário nessa conversão trivial).
function formatDateBR(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

// occurrence.createdAt agora é ISO 8601 completo (data + hora), não mais só
// "HH:mm" — formata pro padrão pt-BR pra exibição em e-mail/UI.
function formatOccurrenceTimestamp(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}
import { useIsMobile } from './utils/useIsMobile';

export default function App() {
  const [session, setSession] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isCallbackRoute, setIsCallbackRoute] = useState(
    window.location.pathname.startsWith('/auth/callback') ||
    window.location.hash.includes('access_token') ||
    window.location.search.includes('code=')
  );

  const [currentUser, setCurrentUser] = useState({
    name: 'Usuário',
    email: '',
    role: ROLES.PENDENTE
  });

  // Ref "sempre atualizada" de currentUser — usada dentro do listener de
  // Realtime (useEffect com deps [session], ver abaixo) pra ler o valor
  // mais recente sem precisar recriar a inscrição do canal a cada mudança
  // de estado (o que forçaria reconectar o WebSocket sempre que qualquer
  // colaborador fosse editado).
  const currentUserRef = useRef(currentUser);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

  // Monta o currentUser a partir da sessão, lendo o cargo do claim `user_role`
  // do JWT (definido pelo Custom Access Token Hook no backend) — nunca do
  // user_metadata, que é editável pelo próprio usuário e não é confiável
  // para controle de acesso.
  const buildUserFromSession = (session) => {
    if (!session?.user) return null;
    const meta = session.user.user_metadata || {};
    return {
      id: session.user.id,
      name: meta.full_name || meta.name || session.user.email?.split('@')[0] || 'Usuário',
      email: session.user.email || '',
      role: getRoleFromSession(session) || ROLES.PENDENTE,
      // O Google retorna a foto ora em avatar_url, ora em picture — tenta os dois.
      avatar: meta.avatar_url || meta.picture || null
    };
  };

  useEffect(() => {
    if (!supabase) {
      setLoadingAuth(false);
      return;
    }

    // Busca sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setCurrentUser(buildUserFromSession(session));
      }
      setLoadingAuth(false);
    });

    // Escuta mudanças no estado de autenticação em tempo real
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setCurrentUser(session?.user ? buildUserFromSession(session) : null);
      setLoadingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // O cargo agora vem do backend (JWT), não é mais editável pelo usuário —
  // "Meu Perfil" só atualiza o avatar.
  const handleUpdateUser = (updatedUser) => {
    setCurrentUser(prev => ({ ...prev, avatar: updatedUser?.avatar }));
  };


  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setCurrentUser(null);
    showToast('Você saiu da sua conta.');
  };

  // Logout forçado (não pelo próprio usuário) — usado quando o polling de
  // "minha conta ainda existe?" detecta que o colaborador foi excluído do
  // banco por um Administrador/Direção. Mostra o motivo na tela de Login.
  const handleForcedLogout = async (reason) => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setCurrentUser(null);
    setLogoutReason(reason);
  };

  const [activeTab, setActiveTab] = useState('map'); // map | timeline | occurrences | settings
  const [spaces, setSpaces] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [classes, setClasses] = useState([]);
  const [weeklySchedule, setWeeklySchedule] = useState({});
  const [occurrences, setOccurrences] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [adminAuditLog, setAdminAuditLog] = useState([]);
  const [adminAuditLogLoading, setAdminAuditLogLoading] = useState(false);
  const [allocations, setAllocations] = useState([]);

  // Mesmo motivo da currentUserRef acima: ler o colaborador mais recente
  // (pra achar o user_id vinculado a um id de linha excluída) sem depender
  // de `collaborators` no array de dependências do listener de Realtime.
  const collaboratorsRef = useRef(collaborators);
  useEffect(() => { collaboratorsRef.current = collaborators; }, [collaborators]);

  const [selectedSpace, setSelectedSpace] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(todayDateString());
  const [selectedTime, setSelectedTime] = useState(nowTimeString());
  const [toastMessage, setToastMessage] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const [logoutReason, setLogoutReason] = useState(null);
  const [, setTick] = useState(0);

  // Modals state
  const [spaceToAllocate, setSpaceToAllocate] = useState(null);
  const [seriesResult, setSeriesResult] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportModalSpaceId, setReportModalSpaceId] = useState(null);
  const [showAddCollaboratorModal, setShowAddCollaboratorModal] = useState(false);
  const [collaboratorToEdit, setCollaboratorToEdit] = useState(null);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [classToEdit, setClassToEdit] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 👤 Cargo do sistema (Pendente/Professor/Direção/Equipe de Suporte/
  // Administrador) agora é só mais um campo do colaborador — unificado
  // com o cadastro de "Profissionais" (collaborators já vem carregado
  // pelo loadInitialData, não precisa de um fetch separado).
  const handleUpdateCollaboratorRole = async (colId, newRole) => {
    try {
      await dbUpdateCollaboratorSystemRole(colId, newRole);
      setCollaborators(prev => prev.map(c => c.id === colId ? { ...c, systemRole: newRole } : c));
      showToast(`Cargo do sistema atualizado para ${newRole}! 🛡️`);
    } catch (e) {
      console.error('[Reflow] Erro ao atualizar cargo do sistema:', e);
      showToast('Não foi possível atualizar o cargo. Tente novamente.');
    }
  };

  // 🛡️ Log de auditoria administrativa — só Administrador enxerga (RLS já
  // restringe o SELECT a is_admin(), aqui é só lazy-load ao abrir a aba).
  const handleLoadAdminAuditLog = useCallback(async () => {
    setAdminAuditLogLoading(true);
    const rows = await dbGetAdminAuditLog();
    setAdminAuditLog(rows);
    setAdminAuditLogLoading(false);
  }, []);

  // 🔄 Carrega os dados iniciais do Supabase se configurado
  useEffect(() => {
    loadInitialData().then(data => {
      if (data.spaces) setSpaces(data.spaces);
      if (data.collaborators) setCollaborators(data.collaborators);
      if (data.classes) setClasses(data.classes);
      if (data.occurrences) setOccurrences(data.occurrences);
      if (data.auditLogs) setAuditLogs(data.auditLogs);
      if (data.allocations) setAllocations(data.allocations);
    });
  }, []);

  // 📡 Sincronização em tempo real (Supabase Realtime) — sem isso, uma
  // alocação/ocorrência/edição feita por outro usuário só aparecia aqui
  // depois de um F5, já que loadInitialData() acima só roda uma vez no
  // mount. Cada handler funde o evento recebido no estado local por id
  // (upsert/remove) — por isso é seguro receber de volta o próprio evento
  // gerado por uma ação deste mesmo cliente (idempotente, sem duplicar).
  // Só assina depois de autenticado: a RLS (is_approved()) bloquearia os
  // eventos de qualquer forma para quem ainda não tem sessão.
  useEffect(() => {
    if (!session) return;

    // Substitui o item existente (mesmo id) ou insere no início da lista.
    const upsertById = (list, item) => {
      const idx = list.findIndex(x => x.id === item.id);
      if (idx === -1) return [item, ...list];
      const copy = [...list];
      copy[idx] = { ...copy[idx], ...item };
      return copy;
    };

    const unsubscribe = subscribeToChanges({
      onSpaceChange: (eventType, space, oldRow) => {
        if (eventType === 'DELETE') {
          const deletedId = String(oldRow.id);
          setSpaces(prev => prev.filter(sp => sp.id !== deletedId));
          setSelectedSpace(prev => (prev && prev.id === deletedId) ? null : prev);
          return;
        }
        setSpaces(prev => {
          const idx = prev.findIndex(sp => sp.id === space.id);
          // Sala nova pra este cliente — ainda sem alocações conhecidas.
          if (idx === -1) return [...prev, { ...space, scheduleToday: [] }];
          const copy = [...prev];
          copy[idx] = { ...copy[idx], ...space };
          return copy;
        });
        setSelectedSpace(prev => (prev && prev.id === space.id) ? { ...prev, ...space } : prev);
      },

      onAllocationChange: (eventType, alloc, oldRow) => {
        if (eventType === 'DELETE') {
          const deletedId = String(oldRow.id);
          setAllocations(prev => prev.filter(a => a.id !== deletedId));
          setSpaces(prev => prev.map(sp => ({
            ...sp,
            scheduleToday: (sp.scheduleToday || []).filter(a => a.id !== deletedId)
          })));
          setSelectedSpace(prev => prev
            ? { ...prev, scheduleToday: (prev.scheduleToday || []).filter(a => a.id !== deletedId) }
            : prev);
          return;
        }

        setAllocations(prev => upsertById(prev, alloc));

        const scheduleEntry = allocationToScheduleEntry(alloc);
        setSpaces(prev => prev.map(sp => {
          if (sp.id !== alloc.spaceId) return sp;
          return { ...sp, scheduleToday: upsertById(sp.scheduleToday || [], scheduleEntry) };
        }));
        setSelectedSpace(prev => (prev && prev.id === alloc.spaceId)
          ? { ...prev, scheduleToday: upsertById(prev.scheduleToday || [], scheduleEntry) }
          : prev);
      },

      onOccurrenceChange: (eventType, occ, oldRow) => {
        if (eventType === 'DELETE') {
          const deletedId = String(oldRow.id);
          setOccurrences(prev => prev.filter(o => o.id !== deletedId));
          return;
        }
        setOccurrences(prev => upsertById(prev, occ));
      },

      onAuditLogChange: (eventType, audit, oldRow) => {
        if (eventType === 'DELETE') {
          const deletedId = String(oldRow.id);
          setAuditLogs(prev => prev.filter(a => a.id !== deletedId));
          return;
        }
        setAuditLogs(prev => upsertById(prev, audit));
      },

      onCollaboratorChange: (eventType, col, oldRow) => {
        if (eventType === 'DELETE') {
          const deletedId = String(oldRow.id);

          // Se a linha excluída é a conta atualmente logada, desloga na
          // hora — precisa achar o user_id ANTES de tirar do estado local,
          // porque o evento de DELETE só traz o id da linha (não o
          // user_id). Reage imediatamente em vez de esperar até 10s pelo
          // polling de segurança abaixo (que continua existindo como
          // rede de proteção caso este canal caia).
          const deletedCol = collaboratorsRef.current.find(c => c.id === deletedId);
          if (deletedCol?.userId && deletedCol.userId === currentUserRef.current?.id) {
            handleForcedLogout('Sua conta foi removida do sistema. Você foi desconectado automaticamente.');
          }

          setCollaborators(prev => prev.filter(c => c.id !== deletedId));
          return;
        }

        // Se o cargo do sistema da conta atualmente logada mudou (promoção
        // ou rebaixamento), força a renovação da sessão. O cargo em uso no
        // app vem do claim `user_role` do JWT (ver buildUserFromSession),
        // não da tabela — sem renovar o token, a tela até poderia mostrar
        // o cargo novo, mas as policies de RLS no banco continuariam
        // aplicando o cargo ANTIGO até o próximo refresh natural do token
        // (até 1h depois). refreshSession() força o Custom Access Token
        // Hook a rodar de novo agora, embutindo o cargo atual no token; o
        // listener de onAuthStateChange (acima) então atualiza currentUser
        // e a UI (abas permitidas, tela de Pendente etc.) sozinha.
        if (col.userId && col.userId === currentUserRef.current?.id && col.systemRole !== currentUserRef.current?.role) {
          supabase.auth.refreshSession().then(() => {
            showToast(`Seu cargo foi atualizado para ${col.systemRole}. 🔄`);
          });
        }

        setCollaborators(prev => upsertById(prev, col));
      },

      onClassChange: (eventType, cls, oldRow) => {
        if (eventType === 'DELETE') {
          const deletedId = String(oldRow.id);
          setClasses(prev => prev.filter(c => c.id !== deletedId));
          return;
        }
        setClasses(prev => upsertById(prev, cls));
      }
    });

    return unsubscribe;
  }, [session]);

  // 🔐 Garante que o usuário nunca fique numa aba à qual seu cargo não tem acesso
  // (ex: Equipe de Suporte é restrita à Central de Ocorrências)
  useEffect(() => {
    const allowedTabs = getAllowedTabs(currentUser?.role);
    if (!allowedTabs.includes(activeTab)) {
      setActiveTab(allowedTabs[0]);
    }
  }, [currentUser?.role, activeTab]);

  // ⏱️ Clock de tempo real — re-renderiza a cada 60 segundos
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  // 🔒 Logout automático — a cada 10s, confirma que a conta do usuário
  // logado ainda existe em collaborators. Se um Administrador/Direção a
  // excluir enquanto a sessão está ativa, o access_token atual continua
  // sendo aceito pelo Supabase até expirar (a policy de RLS só lê o claim
  // já embutido no JWT, não re-consulta o banco a cada request) — este
  // polling é o que força o logout sem esperar essa expiração natural.
  // 10s casa com o intervalo já usado pela liberação automática de
  // alocações expiradas logo abaixo — mesmo padrão, custo desprezível
  // (SELECT leve por id) para o tamanho desta aplicação.
  // Só roda para usuários já aprovados: para "Pendente", a policy de
  // leitura de collaborators exige is_approved(), então a query seria
  // bloqueada por RLS (não por ausência real da linha) — geraria falso
  // positivo. Quem está Pendente já tem seu próprio tratamento (tela
  // "Aguardando Aprovação" + botão "Verificar novamente").
  useEffect(() => {
    if (!currentUser?.id || currentUser.role === ROLES.PENDENTE) return;
    const checkInterval = setInterval(async () => {
      const { exists } = await dbCheckCollaboratorExists(currentUser.id);
      if (exists === false) {
        handleForcedLogout('Sua conta foi removida do sistema. Você foi desconectado automaticamente.');
      }
    }, 10_000);
    return () => clearInterval(checkInterval);
  }, [currentUser?.id, currentUser?.role]);

  // 🔓 Liberação Automática — verifica alocações expiradas a cada 60s
  useEffect(() => {
    const releaseInterval = setInterval(() => {
      const currentMinutes = nowInMinutes();
      const today = todayDateString();

      const expiredAllocIds = [];
      const spaceIdsToCheck = new Set();

      // Coleta todas as alocações expiradas de todas as salas
      spaces.forEach(sp => {
        if (sp.status === 'MANUTENCAO') return;
        const allocs = sp.scheduleToday || [];
        allocs.forEach(alloc => {
          const allocDate = alloc.date || today;
          if (allocDate !== today) return;
          const end = timeToMinutes(alloc.endTime);
          if (currentMinutes >= end) {
            expiredAllocIds.push(alloc.id);
            spaceIdsToCheck.add(sp.id);
          }
        });
      });

      if (expiredAllocIds.length === 0) return;

      console.log(`[Reflow] ⏰ ${expiredAllocIds.length} alocação(ões) expirada(s) detectada(s). Liberando salas...`);

      // Atualiza o estado local — remove alocações expiradas e muda status
      setSpaces(prev => prev.map(sp => {
        if (!spaceIdsToCheck.has(sp.id)) return sp;
        const updatedSchedule = (sp.scheduleToday || []).filter(
          a => !expiredAllocIds.includes(a.id)
        );
        const newStatus = updatedSchedule.length > 0 ? sp.status : 'LIVRE';
        return { ...sp, scheduleToday: updatedSchedule, status: newStatus };
      }));

      // Atualiza o drawer lateral se aberto
      if (selectedSpace && spaceIdsToCheck.has(selectedSpace.id)) {
        setSelectedSpace(prev => {
          if (!prev) return prev;
          const updatedSchedule = (prev.scheduleToday || []).filter(
            a => !expiredAllocIds.includes(a.id)
          );
          const newStatus = updatedSchedule.length > 0 ? prev.status : 'LIVRE';
          return { ...prev, scheduleToday: updatedSchedule, status: newStatus };
        });
      }

      // Persiste no banco de dados em background
      dbReleaseExpiredAllocations(expiredAllocIds, [...spaceIdsToCheck]);
    }, 10_000); // Verifica a cada 10 segundos

    return () => clearInterval(releaseInterval);
  }, [spaces, selectedSpace]);

  // 🔔 Inscreve ouvinte de eventos do sistema (Event-driven Architecture)
  useEffect(() => {
    const unsubscribeCreated = eventService.on(EVENTS.OCCURRENCE_CREATED, async (data) => {
      const { occurrence, targetEmail } = data;
      console.log('⚡ Evento Ocorrência Criada Disparado:', occurrence);

      // E-mail de quem reportou (só pra exibição no corpo do e-mail — o
      // envio de verdade sai sempre pela conta dedicada do sistema, veja
      // supabase/functions/send-occurrence-email).
      const reporterEmail = currentUser.email || '—';
      const subject = `[REFLOW ALERT] Ocorrência Aberta - ${occurrence.spaceName}`;

      // Template HTML Premium
      const bodyHtml = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; padding: 30px; color: #0f2942;">
          <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
            
            <div style="background-color: #0b2238; padding: 24px 30px; text-align: center; border-bottom: 4px solid #b91c1c;">
              <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px;">REFLOW • Suporte Técnico & Limpeza</h1>
              <p style="color: #cbd5e1; margin: 6px 0 0 0; font-size: 13px;">Alerta Automático de Ocorrência Técnica</p>
            </div>

            <div style="padding: 30px;">
              <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-left: 5px solid #ef4444; border-radius: 6px; padding: 12px 16px; margin-bottom: 24px;">
                <span style="color: #991b1b; font-weight: 800; font-size: 13px; text-transform: uppercase;">
                  🚨 OCORRÊNCIA ABERTA - PRIORIDADE: ${occurrence.priority}
                </span>
              </div>

              <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; color: #64748b; font-size: 13px; font-weight: 600; width: 140px;">📍 Espaço / Sala:</td>
                  <td style="padding: 10px 0; color: #0f2942; font-size: 14px; font-weight: 800;">${occurrence.spaceName}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; color: #64748b; font-size: 13px; font-weight: 600;">⚠️ Tipo de Falha:</td>
                  <td style="padding: 10px 0; color: #0f2942; font-size: 14px; font-weight: 700;">${occurrence.failureType}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; color: #64748b; font-size: 13px; font-weight: 600;">👤 Solicitante:</td>
                  <td style="padding: 10px 0; color: #0f2942; font-size: 14px; font-weight: 600;">${occurrence.reportedBy} (${reporterEmail})</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; color: #64748b; font-size: 13px; font-weight: 600;">🕒 Horário do Chamado:</td>
                  <td style="padding: 10px 0; color: #0f2942; font-size: 14px; font-weight: 600;">${formatOccurrenceTimestamp(occurrence.createdAt)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #64748b; font-size: 13px; font-weight: 600;">✉️ Destinatário:</td>
                  <td style="padding: 10px 0; color: #0f2942; font-size: 14px; font-weight: 600;">${targetEmail}</td>
                </tr>
              </table>

              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 24px;">
                <div style="font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                  📝 Detalhes e Descrição do Ocorrido:
                </div>
                <div style="font-size: 14px; color: #334155; line-height: 1.6; font-style: italic;">
                  "${occurrence.description}"
                </div>
              </div>

              <div style="text-align: center; margin-top: 24px;">
                <a href="http://localhost:3000" style="background-color: #0b2238; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 6px; display: inline-block;">
                  🔍 Abrir no Painel Reflow
                </a>
              </div>
            </div>

            <div style="background-color: #f1f5f9; padding: 16px 30px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
              Este é um e-mail automático gerado pelo sistema <strong>Reflow</strong>.
            </div>
          </div>
        </div>
      `;

      let gmailMsgId = null;
      let apiStatusText;
      let deliveryFailed = false;

      // Envia o e-mail de verdade via Edge Function (conta Gmail dedicada
      // no servidor — nenhum dado sai para terceiros nem depende do
      // professor ter conectado o próprio Gmail).
      try {
        const res = await sendOccurrenceEmail({ to: targetEmail, subject, bodyHtml });
        gmailMsgId = res.id;
        apiStatusText = res.statusText;
        showToast(`📧 E-mail entregue na caixa ${targetEmail}!`);
      } catch (err) {
        console.error('Erro no envio do e-mail:', err);
        deliveryFailed = true;
        apiStatusText = `FALHA NO ENVIO — ${err.message || 'erro desconhecido'}`;
        showToast(`⚠️ Não foi possível enviar o e-mail para ${targetEmail}. A ocorrência foi registrada mesmo assim.`);
      }

      // Cria a entrada de auditoria
      const newAudit = {
        id: `audit-${Date.now()}`,
        occurrenceId: occurrence.id,
        to: targetEmail,
        subject: subject,
        priorityBadge: occurrence.priority === 'Alta' ? 'URGENTE' : occurrence.priority.toUpperCase(),
        timestamp: occurrence.createdAt,
        gmailMessageId: gmailMsgId,
        deliveryFailed,
        snippet: `Prezados membros da equipe, foi registrada uma ocorrência em ${occurrence.spaceName}: ${occurrence.description}`,
        fullBody: `DE: Reflow (envio automático)
PARA: ${targetEmail}
STATUS ENTREGA: ${apiStatusText}
DATA: ${formatOccurrenceTimestamp(occurrence.createdAt)}
ASSUNTO: ${subject}

Uma nova ocorrência foi aberta no sistema Reflow:
- Local: ${occurrence.spaceName}
- Tipo de Falha: ${occurrence.failureType}
- Prioridade: ${occurrence.priority}
- Solicitante: ${currentUser.name} (${reporterEmail})
- Destinatário: ${targetEmail}

Descrição:
"${occurrence.description}"

Status Atual: ABERTO`
      };

      try {
        await dbAddOccurrence(occurrence, newAudit);
      } catch (err) {
        console.error('[Reflow] Erro ao salvar ocorrência no banco:', err);
        showToast('⚠️ A ocorrência foi registrada na tela, mas falhou ao salvar no banco — pode não aparecer se a página for recarregada.');
      }
      setAuditLogs(prev => [newAudit, ...prev]);
    });

    return () => unsubscribeCreated();
  }, [currentUser]);

  // --- Handlers ---
  // Sempre processa uma lista de datas — 1 pra reserva avulsa, N pra série
  // recorrente (recurringDates vem sempre preenchido pelo ModalReserveSpace,
  // nunca mais um `date` singular). Cada ocorrência usa a data real vinda
  // do modal — corrige um bug pré-existente em que a reserva avulsa sempre
  // usava `selectedDate` (o dia visualizado no mapa), ignorando por completo
  // a data escolhida no formulário.
  const handleAllocateConfirm = async (allocationData) => {
    const { spaceId, teacher, class: className, students, startTime, endTime, recurringDates, isRecurring } = allocationData;

    const targetSpace = spaces.find(s => s.id === spaceId);
    if (targetSpace && targetSpace.status === 'MANUTENCAO') {
      showToast('⚠️ Sala em MANUTENÇÃO! Não é possível alocar este ambiente.');
      return;
    }

    const seriesId = isRecurring ? crypto.randomUUID() : null;
    const timeToMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    const newStart = timeToMin(startTime);
    const newEnd = timeToMin(endTime);

    const succeeded = [];
    const failed = [];

    for (let i = 0; i < recurringDates.length; i++) {
      const date = recurringDates[i];

      // 🔒 Verifica se a turma já está alocada em outra sala nessa data/horário
      let classClash = null;
      for (const sp of spaces) {
        for (const alloc of (sp.scheduleToday || [])) {
          if (alloc.class === className && (alloc.date || date) === date) {
            const existStart = timeToMin(alloc.startTime);
            const existEnd = timeToMin(alloc.endTime);
            if (newStart < existEnd && newEnd > existStart) {
              classClash = `Turma já alocada na sala "${sp.name}" das ${alloc.startTime} às ${alloc.endTime}`;
              break;
            }
          }
        }
        if (classClash) break;
      }
      if (classClash) {
        failed.push({ date, reason: classClash });
        continue;
      }

      const newAlloc = {
        id: `alloc-${Date.now()}-${i}`,
        spaceId,
        teacher,
        class: className,
        students,
        startTime,
        endTime,
        date,
        seriesId
      };

      // Só entra em succeeded depois que o banco confirmar — se outra
      // pessoa reservou o mesmo horário um instante antes, a trava do banco
      // (allocations_no_overlap) recusa e essa data cai em failed.
      try {
        await dbAddAllocation(newAlloc);
        succeeded.push(newAlloc);
      } catch (err) {
        console.error('[Reflow] Erro ao confirmar alocação:', err);
        failed.push({ date, reason: err.message || 'Não foi possível confirmar a reserva.' });
      }
    }

    if (succeeded.length > 0) {
      // Só marca a sala como OCUPADO (status "cru", usado como fallback pra
      // hoje em getRealTimeStatus) se alguma das ocorrências criadas for de
      // HOJE — uma reserva pra uma data futura não deve marcar a sala como
      // ocupada agora; o status por data/hora selecionada já é recalculado
      // corretamente a partir de scheduleToday em spacesWithRealTimeStatus.
      const hasTodayOccurrence = succeeded.some(a => a.spaceId === spaceId && a.date === todayDateString());

      setSpaces(prevSpaces => prevSpaces.map(sp => {
        if (sp.id !== spaceId) return sp;
        const newForThisSpace = succeeded.filter(a => a.spaceId === spaceId);
        return {
          ...sp,
          ...(hasTodayOccurrence ? { status: 'OCUPADO' } : {}),
          scheduleToday: [...(sp.scheduleToday || []), ...newForThisSpace]
        };
      }));

      if (selectedSpace && selectedSpace.id === spaceId) {
        setSelectedSpace(prev => ({
          ...prev,
          ...(hasTodayOccurrence ? { status: 'OCUPADO' } : {}),
          scheduleToday: [...(prev.scheduleToday || []), ...succeeded]
        }));
      }
    }

    setSpaceToAllocate(null);

    if (!isRecurring) {
      if (succeeded.length > 0) {
        showToast('Espaço Alocado com Sucesso! 🟢');
      } else {
        showToast(`⚠️ ${failed[0]?.reason || 'Não foi possível confirmar a reserva. Tente novamente.'}`);
      }
    } else {
      setSeriesResult({ succeeded, failed, className, spaceName: targetSpace?.name || '' });
    }
  };

  const handleCancelReservation = async (spaceId, allocationId) => {
    try {
      await dbDeleteAllocation(allocationId, spaceId);
    } catch (err) {
      console.error('[Reflow] Erro ao cancelar reserva:', err);
      showToast('⚠️ Não foi possível cancelar a reserva. Tente novamente.');
      return;
    }

    // status "cru" (fallback pra hoje em getRealTimeStatus) só deve
    // considerar alocações de HOJE que sobraram — uma reserva futura
    // remanescente não deve manter a sala marcada como ocupada hoje.
    const todayStr = todayDateString();

    setSpaces(prevSpaces => prevSpaces.map(sp => {
      if (sp.id === spaceId) {
        const updatedSchedule = (sp.scheduleToday || []).filter(a => a.id !== allocationId);
        const hasTodayLeft = updatedSchedule.some(a => (a.date || todayStr) === todayStr);
        return { ...sp, status: hasTodayLeft ? 'OCUPADO' : 'LIVRE', scheduleToday: updatedSchedule };
      }
      return sp;
    }));

    if (selectedSpace && selectedSpace.id === spaceId) {
      setSelectedSpace(prev => {
        const updatedSchedule = (prev.scheduleToday || []).filter(a => a.id !== allocationId);
        const hasTodayLeft = updatedSchedule.some(a => (a.date || todayStr) === todayStr);
        return {
          ...prev,
          status: hasTodayLeft ? 'OCUPADO' : 'LIVRE',
          scheduleToday: updatedSchedule
        };
      });
    }

    showToast('Reserva Cancelada 🗑️');
  };

  // Cancela TODAS as ocorrências de uma série recorrente de uma vez —
  // diferente de handleCancelReservation, que cancela só 1 ocorrência
  // específica (usado pelo SpaceDrawer, continua inalterado).
  const handleCancelSeries = async (seriesId, affectedSpaceIds) => {
    try {
      await dbDeleteAllocationSeries(seriesId, affectedSpaceIds);
    } catch (err) {
      console.error('[Reflow] Erro ao cancelar série:', err);
      showToast('⚠️ Não foi possível cancelar a série. Tente novamente.');
      return;
    }

    // Mesmo cuidado de handleCancelReservation: só considera alocações de
    // HOJE remanescentes pra decidir o status "cru" da sala.
    const todayStr = todayDateString();

    setSpaces(prevSpaces => prevSpaces.map(sp => {
      if (!affectedSpaceIds.includes(sp.id)) return sp;
      const updatedSchedule = (sp.scheduleToday || []).filter(a => a.seriesId !== seriesId);
      const hasTodayLeft = updatedSchedule.some(a => (a.date || todayStr) === todayStr);
      return { ...sp, status: hasTodayLeft ? 'OCUPADO' : 'LIVRE', scheduleToday: updatedSchedule };
    }));

    if (selectedSpace && affectedSpaceIds.includes(selectedSpace.id)) {
      setSelectedSpace(prev => {
        const updatedSchedule = (prev.scheduleToday || []).filter(a => a.seriesId !== seriesId);
        const hasTodayLeft = updatedSchedule.some(a => (a.date || todayStr) === todayStr);
        return { ...prev, status: hasTodayLeft ? 'OCUPADO' : 'LIVRE', scheduleToday: updatedSchedule };
      });
    }

    showToast('Série de Reservas Cancelada 🗑️');
  };

  // 🔧 Atualiza o status de um espaço (estado local + banco) — usado pra
  // colocar/tirar uma sala de MANUTENCAO automaticamente junto com o ciclo
  // de vida das ocorrências.
  const setSpaceStatus = (spaceId, status) => {
    // Efeito colateral "melhor esforço" de ações maiores (resolver/reabrir
    // ocorrência etc.) — não bloqueia a ação principal, mas agora avisa se
    // falhar em vez de engolir o erro em silêncio.
    dbUpdateSpaceStatus(spaceId, status).catch(err => {
      console.error('[Reflow] Erro ao atualizar status da sala:', err);
      showToast('⚠️ Não foi possível atualizar o status da sala no banco.');
    });
    setSpaces(prev => prev.map(sp => sp.id === spaceId ? { ...sp, status } : sp));
    setSelectedSpace(prev => (prev && prev.id === spaceId) ? { ...prev, status } : prev);
  };

  const handleReportOccurrence = (occurrenceData) => {
    const newOcc = {
      id: `occ-${Date.now()}`,
      ...occurrenceData,
      status: 'ABERTO',
      targetDepartment: occurrenceData.targetEmail,
      reportedBy: currentUser.name,
      reportedByUserId: currentUser.id
    };

    setOccurrences(prev => [newOcc, ...prev]);

    // 🔧 A sala reportada entra em MANUTENÇÃO automaticamente até a
    // ocorrência (ou todas, se houver mais de uma) ser resolvida.
    setSpaceStatus(newOcc.spaceId, 'MANUTENCAO');

    // ⚡ Dispara o evento oficial da aplicação
    eventService.emit(EVENTS.OCCURRENCE_CREATED, {
      occurrence: newOcc,
      targetEmail: occurrenceData.targetEmail
    });

    setShowReportModal(false);
    setReportModalSpaceId(null);
  };

  const handleUpdateOccurrenceStatus = async (id, newStatus) => {
    try {
      await dbUpdateOccurrenceStatus(id, newStatus);
    } catch (err) {
      console.error('[Reflow] Erro ao atualizar status da ocorrência:', err);
      showToast('⚠️ Não foi possível atualizar o status do chamado. Tente novamente.');
      return;
    }

    setOccurrences(prev => {
      // Também sincroniza resolvedAt localmente, espelhando o que a trigger
      // do banco faz — sem isso, o Dashboard só veria o novo resolved_at
      // depois de um reload, já que loadInitialData() roda uma vez só.
      const updated = prev.map(o => o.id === id
        ? { ...o, status: newStatus, resolvedAt: newStatus === 'RESOLVIDO' ? new Date().toISOString() : null }
        : o);
      const changedOcc = updated.find(o => o.id === id);

      if (changedOcc) {
        if (newStatus === 'ABERTO') {
          // Reabriu o chamado — a sala volta pra manutenção
          setSpaceStatus(changedOcc.spaceId, 'MANUTENCAO');
        } else if (newStatus === 'RESOLVIDO') {
          // Só libera a sala se não sobrar nenhuma outra ocorrência aberta pra ela
          const stillOpen = updated.some(o => o.spaceId === changedOcc.spaceId && o.status !== 'RESOLVIDO');
          if (!stillOpen) {
            setSpaceStatus(changedOcc.spaceId, 'LIVRE');
          }
        }
      }

      return updated;
    });

    showToast(newStatus === 'RESOLVIDO' ? 'Chamado Marcado como Resolvido! ✅' : 'Chamado Reaberto! 🔓');
  };

  // 🗑️ Qualquer cargo pode apagar a própria solicitação (a RLS garante
  // isso no banco); só a Equipe de Suporte pode "Limpar Histórico" geral.
  const handleDeleteOccurrence = async (id) => {
    try {
      await dbDeleteOccurrence(id);
    } catch (err) {
      console.error('[Reflow] Erro ao excluir ocorrência:', err);
      showToast('⚠️ Não foi possível excluir a solicitação. Tente novamente.');
      return;
    }

    setOccurrences(prev => {
      const target = prev.find(o => o.id === id);
      const updated = prev.filter(o => o.id !== id);

      if (target) {
        const stillOpen = updated.some(o => o.spaceId === target.spaceId && o.status !== 'RESOLVIDO');
        if (!stillOpen) {
          setSpaceStatus(target.spaceId, 'LIVRE');
        }
      }

      return updated;
    });

    showToast('Solicitação excluída. 🗑️');
  };

  const handleAddCollaborator = async (colData) => {
    const finalData = {
      ...colData,
      id: colData.id || `collab-${Date.now()}`
    };

    try {
      await dbSaveCollaborator(finalData);
    } catch (err) {
      console.error('[Reflow] Erro ao salvar colaborador:', err);
      showToast('⚠️ Não foi possível salvar o colaborador. Tente novamente.');
      return;
    }

    if (colData.id && collaborators.find(c => c.id === colData.id)) {
      setCollaborators(prev => prev.map(c => c.id === colData.id ? finalData : c));
      showToast('Colaborador Atualizado! ✅');
    } else {
      setCollaborators(prev => [finalData, ...prev]);
      showToast('Colaborador Cadastrado! 👤');
    }
    setShowAddCollaboratorModal(false);
    setCollaboratorToEdit(null);
  };

  const handleDeleteCollaborator = async (id) => {
    try {
      await dbDeleteCollaborator(id);
    } catch (err) {
      console.error('[Reflow] Erro ao remover colaborador:', err);
      showToast('⚠️ Não foi possível remover o colaborador. Tente novamente.');
      return;
    }
    setCollaborators(prev => prev.filter(c => c.id !== id));
    showToast('Colaborador Removido');
  };

  const handleAddClass = async (classData) => {
    const exists = classes.some(c => c.id === classData.id);
    try {
      if (exists) {
        await dbUpdateClass(classData);
      } else {
        await dbAddClass(classData);
      }
    } catch (err) {
      console.error('[Reflow] Erro ao salvar turma:', err);
      showToast('⚠️ Não foi possível salvar a turma. Tente novamente.');
      return;
    }

    if (exists) {
      setClasses(prev => prev.map(c => c.id === classData.id ? classData : c));
      showToast('Turma Atualizada com Sucesso! 📚');
    } else {
      setClasses(prev => [...prev, classData]);
      showToast('Turma Adicionada! 📚');
    }
    setShowAddClassModal(false);
    setClassToEdit(null);
  };

  const handleDeleteClass = async (id) => {
    try {
      await dbDeleteClass(id);
    } catch (err) {
      console.error('[Reflow] Erro ao remover turma:', err);
      showToast('⚠️ Não foi possível remover a turma. Tente novamente.');
      return;
    }
    setClasses(prev => prev.filter(c => c.id !== id));
    showToast('Turma Removida');
  };

  const handleUpdateSpaceFeatures = async (spaceId, features) => {
    try {
      await dbUpdateSpaceFeatures(spaceId, features);
    } catch (err) {
      console.error('[Reflow] Erro ao atualizar recursos da sala:', err);
      showToast('⚠️ Não foi possível salvar os recursos da sala. Tente novamente.');
      return;
    }

    setSpaces(prev => prev.map(sp => {
      if (sp.id === spaceId) {
        return { ...sp, equipments: features.equipments, deskType: features.deskType };
      }
      return sp;
    }));
    if (selectedSpace && selectedSpace.id === spaceId) {
      setSelectedSpace(prev => ({ ...prev, equipments: features.equipments, deskType: features.deskType }));
    }
    showToast('Recursos e Mobiliário da sala atualizados! 🛠️');
  };

  const handleUpdateSpace = async (updatedSpaceData) => {
    try {
      await dbUpdateSpace(updatedSpaceData);
    } catch (err) {
      console.error('[Reflow] Erro ao atualizar sala:', err);
      showToast('⚠️ Não foi possível salvar as informações da sala. Tente novamente.');
      return;
    }

    setSpaces(prev => prev.map(sp => sp.id === updatedSpaceData.id ? updatedSpaceData : sp));
    if (selectedSpace && selectedSpace.id === updatedSpaceData.id) {
      setSelectedSpace(updatedSpaceData);
    }
    showToast('Informações da sala salvas com sucesso no banco! 🏢');
  };

  const handleClearHistory = async () => {
    try {
      await dbClearHistory();
    } catch (err) {
      console.error('[Reflow] Erro ao limpar histórico:', err);
      showToast('⚠️ Não foi possível limpar o histórico. Tente novamente.');
      return;
    }
    setOccurrences([]);
    setAuditLogs([]);
    showToast('Histórico de Ocorrências e Auditoria de E-mails Limpo! 🗑️');
  };

  const handleResendEmail = async (auditLog) => {
    try {
      await sendOccurrenceEmail({
        to: auditLog.to,
        subject: auditLog.subject,
        bodyHtml: `<p>${auditLog.snippet}</p>`
      });
      showToast(`Alerta Reenviado com Sucesso para ${auditLog.to}! 📧`);
    } catch (err) {
      console.error('Erro ao reenviar e-mail:', err);
      showToast(`⚠️ Não foi possível reenviar o alerta para ${auditLog.to}.`);
    }
  };


  if (isCallbackRoute) {
    return <AuthCallback onAuthSuccess={(newSession) => { setSession(newSession); setIsCallbackRoute(false); }} />;
  }

  if (loadingAuth) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#0f2942', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!session) {
    return <LoginScreen reason={logoutReason} onDismissReason={() => setLogoutReason(null)} />;
  }

  if (!currentUser || currentUser.role === ROLES.PENDENTE) {
    return <PendingApproval userEmail={currentUser?.email || session.user?.email} onLogout={handleLogout} />;
  }

  // Volta o seletor de data/hora do mapa pro momento real atual — desfaz o
  // "congelamento" de selectedTime (ver comentário no useState acima).
  const handleResetToNow = () => {
    setSelectedDate(todayDateString());
    setSelectedTime(nowTimeString());
  };

  // Calcula espaços com status na data/hora selecionada (padrão: agora)
  const spacesWithRealTimeStatus = spaces.map(sp => {
    const { status, activeAllocation } = getRealTimeStatus(sp, selectedDate, selectedTime);
    return { ...sp, status, currentAllocation: activeAllocation };
  });

  const occupiedCount = spacesWithRealTimeStatus.filter(s => s.status === 'OCUPADO').length;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        spacesCount={spacesWithRealTimeStatus.length}
        occupiedCount={occupiedCount}
        occurrencesCount={occurrences.filter(o => (o.status || 'ABERTO') !== 'RESOLVIDO').length}
        onLogout={handleLogout}
        currentUser={currentUser}
        onUpdateUser={handleUpdateUser}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header Bar */}
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          showSearch={activeTab === 'map'}
          onSearchSubmit={(q) => {
            setActiveTab('map');
            showToast(`Buscando por: "${q}"`);
          }}
          currentUser={currentUser}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(o => !o)}
        />

        {/* Dynamic Views */}
        <main style={{ flex: 1, display: 'flex', marginLeft: isMobile ? 0 : '260px', position: 'relative' }}>
          {activeTab === 'map' && (
            <>
              <InteractiveMap
                spaces={spacesWithRealTimeStatus}
                selectedSpace={selectedSpace}
                setSelectedSpace={(sp) => {
                  if (!sp) { setSelectedSpace(null); return; }
                  const rt = spacesWithRealTimeStatus.find(s => s.id === sp.id) || sp;
                  setSelectedSpace(rt);
                }}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                selectedTime={selectedTime}
                setSelectedTime={setSelectedTime}
                onResetToNow={handleResetToNow}
              />
              <SpaceDrawer
                space={selectedSpace ? spacesWithRealTimeStatus.find(s => s.id === selectedSpace.id) : null}
                onClose={() => setSelectedSpace(null)}
                onAllocate={(sp) => setSpaceToAllocate(sp)}
                onCancelReservation={handleCancelReservation}
                onRequestOccurrence={(sp) => {
                  setReportModalSpaceId(sp.id);
                  setShowReportModal(true);
                }}
                currentDate={`${formatDateBR(selectedDate)} às ${selectedTime}`}
                isAdmin={['Administrador', 'Direção'].includes(currentUser?.role)}
                onUpdateSpaceFeatures={handleUpdateSpaceFeatures}
              />
            </>
          )}

          {activeTab === 'occurrences' && (
            <OccurrencesCenter
              occurrences={occurrences}
              auditLogs={auditLogs}
              currentUser={currentUser}
              onUpdateOccurrenceStatus={handleUpdateOccurrenceStatus}
              onClearHistory={handleClearHistory}
              onDeleteOccurrence={handleDeleteOccurrence}
              onResendEmail={handleResendEmail}
            />
          )}

          {activeTab === 'dashboard' && (
            <AnalyticsDashboard
              spaces={spacesWithRealTimeStatus}
              occurrences={occurrences}
              allocations={allocations}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsModule
              collaborators={collaborators}
              classes={classes}
              weeklySchedule={weeklySchedule}
              onOpenAddCollaborator={() => { setCollaboratorToEdit(null); setShowAddCollaboratorModal(true); }}
              onOpenAddClass={() => { setClassToEdit(null); setShowAddClassModal(true); }}
              onDeleteCollaborator={handleDeleteCollaborator}
              onDeleteClass={handleDeleteClass}
              onEditCollaborator={(col) => { setCollaboratorToEdit(col); setShowAddCollaboratorModal(true); }}
              onEditClass={(cls) => { setClassToEdit(cls); setShowAddClassModal(true); }}
              spaces={spaces}
              currentUser={currentUser}
              onUpdateSpace={handleUpdateSpace}
              onUpdateCollaboratorRole={handleUpdateCollaboratorRole}
              onCancelSeries={handleCancelSeries}
              adminAuditLog={adminAuditLog}
              adminAuditLogLoading={adminAuditLogLoading}
              onLoadAuditLog={handleLoadAdminAuditLog}
            />
          )}
        </main>
      </div>

      {/* Floating Action Siren Button — Equipe de Suporte não reporta ocorrências, apenas as resolve */}
      {currentUser?.role !== ROLES.SUPORTE && (
        <FABAlert onClick={() => {
          setReportModalSpaceId(null);
          setShowReportModal(true);
        }} />
      )}

      {/* Modals */}
      {spaceToAllocate && (
        <ModalReserveSpace
          space={spaceToAllocate}
          classes={classes}
          currentUser={currentUser}
          onClose={() => setSpaceToAllocate(null)}
          onConfirm={handleAllocateConfirm}
          initialDate={selectedDate}
          initialTime={selectedTime}
        />
      )}

      {seriesResult && (
        <ModalSeriesResult
          {...seriesResult}
          onClose={() => setSeriesResult(null)}
        />
      )}

      {showReportModal && (
        <ModalReportOccurrence
          spaces={spaces}
          preSelectedSpaceId={reportModalSpaceId}
          currentUser={currentUser}
          collaborators={collaborators}
          onClose={() => {
            setShowReportModal(false);
            setReportModalSpaceId(null);
          }}
          onSubmit={handleReportOccurrence}
        />
      )}

      {showAddCollaboratorModal && (
        <ModalAddCollaborator
          onClose={() => { setShowAddCollaboratorModal(false); setCollaboratorToEdit(null); }}
          onSubmit={handleAddCollaborator}
          initialData={collaboratorToEdit}
        />
      )}

      {showAddClassModal && (
        <ModalAddClass
          classToEdit={classToEdit}
          onClose={() => { setShowAddClassModal(false); setClassToEdit(null); }}
          onSubmit={handleAddClass}
        />
      )}

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="animate-fade-in" style={{
          position: 'fixed',
          bottom: '2rem',
          left: isMobile ? '1rem' : '280px',
          right: isMobile ? '1rem' : 'auto',
          backgroundColor: '#0b2238',
          color: '#ffffff',
          fontWeight: 600,
          fontSize: '0.875rem',
          padding: '0.85rem 1.5rem',
          borderRadius: '0.5rem',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}
