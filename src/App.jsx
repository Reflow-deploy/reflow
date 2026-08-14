import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import FABAlert from './components/FABAlert';
import InteractiveMap from './components/InteractiveMap';
import SpaceDrawer from './components/SpaceDrawer';
import OccurrencesCenter from './components/OccurrencesCenter';
import SettingsModule from './components/SettingsModule';
import LoginScreen from './components/LoginScreen';
import AuthCallback from './components/AuthCallback';
import PendingApproval from './components/PendingApproval';
import { supabase } from './lib/supabaseClient';

import ModalReserveSpace from './components/modals/ModalReserveSpace';
import ModalReportOccurrence from './components/modals/ModalReportOccurrence';
import ModalAddCollaborator from './components/modals/ModalAddCollaborator';
import ModalAddClass from './components/modals/ModalAddClass';

import { getRealTimeStatus, todayDateString, timeToMinutes, nowInMinutes } from './utils/spaceStatus';
import {
  loadInitialData,
  dbAddAllocation,
  dbDeleteAllocation,
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
  dbReleaseExpiredAllocations
} from './services/supabaseService';
import { eventService, EVENTS } from './services/eventService';
import { sendOccurrenceEmail } from './services/gmailService';
import { getAllowedTabs, ROLES } from './utils/permissions';
import { getRoleFromSession } from './utils/jwt';

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

  const [activeTab, setActiveTab] = useState('map'); // map | timeline | occurrences | settings
  const [spaces, setSpaces] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [classes, setClasses] = useState([]);
  const [weeklySchedule, setWeeklySchedule] = useState({});
  const [occurrences, setOccurrences] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const [selectedSpace, setSelectedSpace] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(todayDateString());
  const [toastMessage, setToastMessage] = useState(null);
  const [, setTick] = useState(0);

  // Modals state
  const [spaceToAllocate, setSpaceToAllocate] = useState(null);
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

  // 🔄 Carrega os dados iniciais do Supabase se configurado
  useEffect(() => {
    loadInitialData().then(data => {
      if (data.spaces) setSpaces(data.spaces);
      if (data.collaborators) setCollaborators(data.collaborators);
      if (data.classes) setClasses(data.classes);
      if (data.occurrences) setOccurrences(data.occurrences);
      if (data.auditLogs) setAuditLogs(data.auditLogs);
    });
  }, []);

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
                  <td style="padding: 10px 0; color: #0f2942; font-size: 14px; font-weight: 600;">${occurrence.createdAt}</td>
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
DATA: ${todayDateString()} - ${occurrence.createdAt}
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

      dbAddOccurrence(occurrence, newAudit);
      setAuditLogs(prev => [newAudit, ...prev]);
    });

    return () => unsubscribeCreated();
  }, [currentUser]);

  // --- Handlers ---
  const handleAllocateConfirm = (allocationData) => {
    const { spaceId, teacher, class: className, students, startTime, endTime } = allocationData;

    const targetSpace = spaces.find(s => s.id === spaceId);
    if (targetSpace && targetSpace.status === 'MANUTENCAO') {
      showToast('⚠️ Sala em MANUTENÇÃO! Não é possível alocar este ambiente.');
      return;
    }

    // 🔒 Verifica se a turma já está alocada em outra sala no mesmo horário
    const timeToMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    const newStart = timeToMin(startTime);
    const newEnd = timeToMin(endTime);

    for (const sp of spaces) {
      const allocs = sp.scheduleToday || [];
      for (const alloc of allocs) {
        if (alloc.class === className && (alloc.date || selectedDate) === selectedDate) {
          const existStart = timeToMin(alloc.startTime);
          const existEnd = timeToMin(alloc.endTime);
          // Verifica sobreposição de horário
          if (newStart < existEnd && newEnd > existStart) {
            showToast(`⚠️ A turma "${className}" já está alocada na sala "${sp.name}" das ${alloc.startTime} às ${alloc.endTime}. Aguarde o término da alocação.`);
            return;
          }
        }
      }
    }

    const newAlloc = {
      id: `alloc-${Date.now()}`,
      spaceId,
      teacher,
      class: className,
      students,
      startTime,
      endTime,
      date: selectedDate
    };

    dbAddAllocation(newAlloc);

    setSpaces(prevSpaces => prevSpaces.map(sp => {
      if (sp.id === spaceId) {
        const updatedSchedule = [...(sp.scheduleToday || []), newAlloc];
        return { ...sp, status: 'OCUPADO', scheduleToday: updatedSchedule };
      }
      return sp;
    }));

    if (selectedSpace && selectedSpace.id === spaceId) {
      setSelectedSpace(prev => ({
        ...prev,
        status: 'OCUPADO',
        scheduleToday: [...(prev.scheduleToday || []), newAlloc]
      }));
    }

    setSpaceToAllocate(null);
    showToast('Espaço Alocado com Sucesso! 🟢');
  };

  const handleCancelReservation = (spaceId, allocationId) => {
    dbDeleteAllocation(allocationId, spaceId);

    setSpaces(prevSpaces => prevSpaces.map(sp => {
      if (sp.id === spaceId) {
        const updatedSchedule = (sp.scheduleToday || []).filter(a => a.id !== allocationId);
        const newStatus = updatedSchedule.length > 0 ? 'OCUPADO' : 'LIVRE';
        return { ...sp, status: newStatus, scheduleToday: updatedSchedule };
      }
      return sp;
    }));

    if (selectedSpace && selectedSpace.id === spaceId) {
      setSelectedSpace(prev => {
        const updatedSchedule = (prev.scheduleToday || []).filter(a => a.id !== allocationId);
        const newStatus = updatedSchedule.length > 0 ? 'OCUPADO' : 'LIVRE';
        return {
          ...prev,
          status: newStatus,
          scheduleToday: updatedSchedule
        };
      });
    }

    showToast('Reserva Cancelada 🗑️');
  };

  // 🔧 Atualiza o status de um espaço (estado local + banco) — usado pra
  // colocar/tirar uma sala de MANUTENCAO automaticamente junto com o ciclo
  // de vida das ocorrências.
  const setSpaceStatus = (spaceId, status) => {
    dbUpdateSpaceStatus(spaceId, status);
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

  const handleUpdateOccurrenceStatus = (id, newStatus) => {
    dbUpdateOccurrenceStatus(id, newStatus);

    setOccurrences(prev => {
      const updated = prev.map(o => o.id === id ? { ...o, status: newStatus } : o);
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
  const handleDeleteOccurrence = (id) => {
    dbDeleteOccurrence(id);

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

  const handleAddCollaborator = (colData) => {
    const finalData = {
      ...colData,
      id: colData.id || `collab-${Date.now()}`
    };

    dbSaveCollaborator(finalData);

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

  const handleDeleteCollaborator = (id) => {
    dbDeleteCollaborator(id);
    setCollaborators(prev => prev.filter(c => c.id !== id));
    showToast('Colaborador Removido');
  };

  const handleAddClass = (classData) => {
    const exists = classes.some(c => c.id === classData.id);
    if (exists) {
      dbUpdateClass(classData);
      setClasses(prev => prev.map(c => c.id === classData.id ? classData : c));
      showToast('Turma Atualizada com Sucesso! 📚');
    } else {
      dbAddClass(classData);
      setClasses(prev => [...prev, classData]);
      showToast('Turma Adicionada! 📚');
    }
    setShowAddClassModal(false);
    setClassToEdit(null);
  };

  const handleDeleteClass = (id) => {
    dbDeleteClass(id);
    setClasses(prev => prev.filter(c => c.id !== id));
    showToast('Turma Removida');
  };

  const handleUpdateSpaceFeatures = (spaceId, features) => {
    dbUpdateSpaceFeatures(spaceId, features);
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

  const handleUpdateSpace = (updatedSpaceData) => {
    dbUpdateSpace(updatedSpaceData);
    setSpaces(prev => prev.map(sp => sp.id === updatedSpaceData.id ? updatedSpaceData : sp));
    if (selectedSpace && selectedSpace.id === updatedSpaceData.id) {
      setSelectedSpace(updatedSpaceData);
    }
    showToast('Informações da sala salvas com sucesso no banco! 🏢');
  };

  const handleClearHistory = () => {
    dbClearHistory();
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
    return <LoginScreen />;
  }

  if (!currentUser || currentUser.role === ROLES.PENDENTE) {
    return <PendingApproval userEmail={currentUser?.email || session.user?.email} onLogout={handleLogout} />;
  }

  // Calcula espaços com status em tempo real
  const spacesWithRealTimeStatus = spaces.map(sp => {
    const { status, activeAllocation } = getRealTimeStatus(sp, selectedDate);
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
        />

        {/* Dynamic Views */}
        <main style={{ flex: 1, display: 'flex', marginLeft: '260px', position: 'relative' }}>
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
                currentDate={new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
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
          left: '280px',
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
