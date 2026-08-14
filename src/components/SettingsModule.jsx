import React, { useState } from 'react';
import { Users, BookOpen, Calendar, Plus, Search, Edit3, Trash2, Clock, Mail, Phone, Check, MapPin, BookMarked, AlertCircle, Cpu, LayoutGrid, ShieldCheck, Hourglass, Link2 } from 'lucide-react';
import { getRealTimeStatus, nowInMinutes, timeToMinutes, todayDateString } from '../utils/spaceStatus';
import { ROLES } from '../utils/permissions';
import ModalEditSpace from './modals/ModalEditSpace';

const ASSIGNABLE_ROLES = [ROLES.PENDENTE, ROLES.PROFESSOR, ROLES.DIRECAO, ROLES.SUPORTE, ROLES.ADMIN];

export default function SettingsModule({
  collaborators,
  classes,
  weeklySchedule,
  onOpenAddCollaborator,
  onOpenAddClass,
  onDeleteCollaborator,
  onDeleteClass,
  onEditCollaborator,
  onEditClass = () => { },
  spaces = [],
  currentUser = {},
  onUpdateSpace = () => { },
  onUpdateCollaboratorRole = () => { }
}) {
  const [subTab, setSubTab] = useState('RESERVATIONS'); // RESERVATIONS | CLASSES | PROFESSIONALS | SPACES
  const [classSubView, setClassSubView] = useState('CLASSES_LIST'); // CLASSES_LIST | WEEKLY_GRID
  const [searchCollaborator, setSearchCollaborator] = useState('');
  const [searchSpace, setSearchSpace] = useState('');
  const [selectedBlockFilter, setSelectedBlockFilter] = useState('ALL');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');
  const [selectedClassForWeekly, setSelectedClassForWeekly] = useState('1º Ano - Ensino Médio');
  const [spaceToEdit, setSpaceToEdit] = useState(null);

  // Somente Administrador ou Direção podem adicionar, editar ou excluir
  const isAdmin = ['Administrador', 'Direção'].includes(currentUser?.role);
  // Trocar o cargo do sistema (acesso) é ainda mais restrito: só
  // Administrador (bate com is_admin() no banco — Direção não passa).
  const isSuperAdmin = currentUser?.role === ROLES.ADMIN;

  const filteredCollaborators = collaborators.filter((col) => {
    const matchesSearch = searchCollaborator === '' ||
      col.name.toLowerCase().includes(searchCollaborator.toLowerCase()) ||
      col.role.toLowerCase().includes(searchCollaborator.toLowerCase()) ||
      col.notes.toLowerCase().includes(searchCollaborator.toLowerCase());

    const matchesRole = selectedRoleFilter === 'ALL' || col.category === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredSpaces = spaces.filter((sp) => {
    const query = searchSpace.toLowerCase();
    const matchesSearch = searchSpace === '' ||
      sp.name.toLowerCase().includes(query) ||
      sp.type.toLowerCase().includes(query) ||
      (sp.equipments && sp.equipments.some(eq => eq.toLowerCase().includes(query)));

    const matchesBlock = selectedBlockFilter === 'ALL' || sp.block === selectedBlockFilter;
    return matchesSearch && matchesBlock;
  });

  return (
    <div style={{ padding: '1.5rem 2rem', flex: 1, overflowY: 'auto' }}>
      {/* Settings Navigation Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f2942' }}>
            Configurações do Sistema
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Centralize a gestão e a visualização de salas, turmas, colaboradores e reservas
          </p>
        </div>

        {/* Sub-Tabs */}
        <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '0.25rem', borderRadius: '0.5rem' }}>
          <button
            onClick={() => setSubTab('RESERVATIONS')}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '0.375rem',
              border: 'none',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: subTab === 'RESERVATIONS' ? '#0b2238' : 'transparent',
              color: subTab === 'RESERVATIONS' ? '#ffffff' : '#64748b'
            }}
          >
            Minhas Reservas
          </button>

          <button
            onClick={() => setSubTab('CLASSES')}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '0.375rem',
              border: 'none',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: subTab === 'CLASSES' ? '#0b2238' : 'transparent',
              color: subTab === 'CLASSES' ? '#ffffff' : '#64748b'
            }}
          >
            Turmas
          </button>

          <button
            onClick={() => setSubTab('PROFESSIONALS')}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '0.375rem',
              border: 'none',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: subTab === 'PROFESSIONALS' ? '#0b2238' : 'transparent',
              color: subTab === 'PROFESSIONALS' ? '#ffffff' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            Profissionais
            {isSuperAdmin && collaborators.some(c => c.systemRole === ROLES.PENDENTE) && (
              <span style={{
                backgroundColor: '#ef4444',
                color: '#ffffff',
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '0.1rem 0.4rem',
                borderRadius: '9999px'
              }}>
                {collaborators.filter(c => c.systemRole === ROLES.PENDENTE).length}
              </span>
            )}
          </button>

          <button
            onClick={() => setSubTab('SPACES')}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '0.375rem',
              border: 'none',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: subTab === 'SPACES' ? '#0b2238' : 'transparent',
              color: subTab === 'SPACES' ? '#ffffff' : '#64748b'
            }}
          >
            Salas
          </button>
        </div>
      </div>

      {/* VIEW: SALAS */}
      {subTab === 'SPACES' && (
        <div>
          {/* Top Action & Search Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, maxWidth: '480px' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Buscar sala por nome, tipo ou equipamentos..."
                  value={searchSpace}
                  onChange={(e) => setSearchSpace(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 1rem 0.6rem 2.25rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Spaces Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {filteredSpaces.map(sp => (
              <div key={sp.id} style={{
                backgroundColor: '#ffffff',
                borderRadius: '0.75rem',
                border: '1px solid #e2e8f0',
                padding: '1.25rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  {/* Status & Type Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', backgroundColor: '#f1f5f9', padding: '0.2rem 0.6rem', borderRadius: '0.25rem', textTransform: 'uppercase' }}>
                      {sp.type}
                    </span>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.5rem',
                      borderRadius: '0.25rem',
                      color: sp.status === 'LIVRE' ? '#15803d' : sp.status === 'OCUPADO' ? '#1d4ed8' : '#b91c1c',
                      backgroundColor: sp.status === 'LIVRE' ? '#dcfce7' : sp.status === 'OCUPADO' ? '#dbeafe' : '#fee2e2'
                    }}>
                      {sp.status}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f2942', margin: '0 0 0.5rem 0' }}>
                    {sp.name}
                  </h3>

                  <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '1rem' }}>
                    <div>🏢 <strong>Bloco:</strong> {sp.block}</div>
                    <div>👥 <strong>Capacidade:</strong> {sp.capacity} alunos</div>
                    <div>🪑 <strong>Mesas:</strong> {sp.deskType === 'Grupo' ? 'Mesas em Grupo (Bancadas)' : sp.deskType === 'Individual' ? 'Mesas Individuais' : 'Layout Misto'}</div>
                  </div>

                  {/* Equipments Badges */}
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', marginBottom: '1rem' }}>
                    <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '0.4rem' }}>
                      Equipamentos Presentes:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {sp.equipments && sp.equipments.length > 0 ? (
                        sp.equipments.map(eq => (
                          <span key={eq} style={{ fontSize: '0.72rem', fontWeight: 600, color: '#334155', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', padding: '0.15rem 0.45rem', borderRadius: '0.25rem' }}>
                            {eq}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>Nenhum equipamento</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                {isAdmin ? (
                  <button
                    onClick={() => setSpaceToEdit(sp)}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #0f2942',
                      backgroundColor: '#ffffff',
                      color: '#0f2942',
                      fontSize: '0.825rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      transition: 'all 0.2s ease',
                      marginTop: '0.5rem'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#0f2942'; e.currentTarget.style.color = '#ffffff'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.color = '#0f2942'; }}
                  >
                    <Edit3 size={14} />
                    Editar Informações da Sala
                  </button>
                ) : (
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center', fontStyle: 'italic', paddingTop: '0.5rem' }}>
                    Modo Leitura (Apenas Admins podem alterar)
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: PROFISSIONAIS */}
      {subTab === 'PROFESSIONALS' && (
        <div>
          {/* Top Action & Search Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, maxWidth: '600px' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Buscar colaborador por nome, cargo ou observação..."
                  value={searchCollaborator}
                  onChange={(e) => setSearchCollaborator(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 1rem 0.6rem 2.25rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>

              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                style={{
                  padding: '0.6rem 1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">Todas as Categorias</option>
                <option value="Docente">Docentes (Professores)</option>
                <option value="Apoio">Apoio (Limpeza / TI)</option>
                <option value="Administrativo">Administrativo (Direção / Coordenação)</option>
              </select>
            </div>

            {isAdmin ? (
              <button
                onClick={onOpenAddCollaborator}
                className="btn-primary"
                style={{ fontSize: '0.85rem' }}
              >
                <Plus size={16} />
                Novo Colaborador
              </button>
            ) : (
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <AlertCircle size={14} />
                Modo Leitura (Apenas Admins cadastram)
              </div>
            )}
          </div>

          {/* Grid de Colaboradores */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {filteredCollaborators.map((col) => {
              const isPendingAccess = isSuperAdmin && col.systemRole === ROLES.PENDENTE;
              const isSelfAccount = col.email?.toLowerCase() === currentUser?.email?.toLowerCase();
              return (
              <div
                key={col.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '0.75rem',
                  border: `1px solid ${isPendingAccess ? '#fde68a' : '#e2e8f0'}`,
                  borderLeft: isPendingAccess ? '4px solid #f59e0b' : '1px solid #e2e8f0',
                  padding: '1.25rem',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        backgroundColor: '#0b2238',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        flexShrink: 0
                      }}>
                        {col.avatarUrl
                          ? <img src={col.avatarUrl} alt={col.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                          : col.initials}
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f2942', margin: 0 }}>
                          {col.name}
                        </h3>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                          {col.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cargo no Sistema (acesso ao app) — só Administrador vê/edita */}
                  {isSuperAdmin && (
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem',
                      backgroundColor: isPendingAccess ? '#fffbeb' : '#f8fafc',
                      border: `1px solid ${isPendingAccess ? '#fde68a' : '#e2e8f0'}`,
                      borderRadius: '0.5rem',
                      padding: '0.5rem 0.65rem',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>
                        {col.userId
                          ? <Link2 size={12} color="#15803d" />
                          : <Hourglass size={12} color="#94a3b8" />}
                        Cargo no Sistema
                      </div>
                      {isSelfAccount ? (
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f2942' }}>{col.systemRole}</span>
                      ) : (
                        <select
                          value={col.systemRole || ROLES.PENDENTE}
                          onChange={(e) => onUpdateCollaboratorRole(col.id, e.target.value)}
                          style={{
                            padding: '0.3rem 0.5rem',
                            borderRadius: '0.375rem',
                            border: `1px solid ${isPendingAccess ? '#f59e0b' : '#cbd5e1'}`,
                            backgroundColor: '#ffffff',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: '#0f2942',
                            cursor: 'pointer'
                          }}
                        >
                          {ASSIGNABLE_ROLES.map(role => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', color: '#475569', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Mail size={14} color="#64748b" />
                      <span>{col.email}</span>
                    </div>
                    {col.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Phone size={14} color="#64748b" />
                        <span>{col.phone}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Clock size={14} color="#64748b" />
                      <span>Jornada: {col.startTime}h às {col.endTime}h</span>
                    </div>
                  </div>

                  {col.workDays && col.workDays.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '1rem' }}>
                      {['Seg', 'Ter', 'Qua', 'Qui', 'Sex'].map((day) => {
                        const active = col.workDays.includes(day);
                        return (
                          <span
                            key={day}
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.4rem',
                              borderRadius: '0.2rem',
                              backgroundColor: active ? '#e0f2fe' : '#f1f5f9',
                              color: active ? '#0369a1' : '#94a3b8'
                            }}
                          >
                            {day}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {col.notes && (
                    <p style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic', borderTop: '1px solid #f1f5f9', paddingTop: '0.6rem', margin: 0 }}>
                      "{col.notes}"
                    </p>
                  )}
                </div>

                {isAdmin && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                    <button
                      onClick={() => onEditCollaborator(col)}
                      style={{
                        flex: 1,
                        padding: '0.4rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        borderRadius: '0.375rem',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        color: '#475569',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <Edit3 size={13} />
                      Editar
                    </button>
                    <button
                      onClick={() => onDeleteCollaborator(col.id)}
                      style={{
                        padding: '0.4rem 0.6rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        borderRadius: '0.375rem',
                        border: '1px solid #fecaca',
                        backgroundColor: '#fef2f2',
                        color: '#b91c1c',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Excluir Colaborador"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW: TURMAS */}
      {subTab === 'CLASSES' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f2942', margin: 0 }}>
              Lista de Turmas Cadastradas
            </h2>

            {isAdmin ? (
              <button
                onClick={onOpenAddClass}
                className="btn-primary"
                style={{ fontSize: '0.85rem' }}
              >
                <Plus size={16} />
                Nova Turma
              </button>
            ) : (
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <AlertCircle size={14} />
                Modo Leitura (Apenas Admins cadastram)
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
            {classes.map((cls) => (
              <div
                key={cls.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                <div style={{ marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f2942', margin: '0 0 0.25rem 0' }}>
                    {cls.name}
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    👥 {cls.studentsCount} alunos matriculados
                  </span>
                </div>

                {isAdmin && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', paddingTop: '0.6rem', borderTop: '1px solid #f1f5f9' }}>
                    <button
                      onClick={() => onEditClass(cls)}
                      style={{
                        flex: 1,
                        padding: '0.4rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        borderRadius: '0.375rem',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        color: '#475569',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <Edit3 size={13} />
                      Editar
                    </button>
                    <button
                      onClick={() => onDeleteClass(cls.id)}
                      style={{
                        padding: '0.4rem 0.6rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        borderRadius: '0.375rem',
                        border: '1px solid #fecaca',
                        backgroundColor: '#fef2f2',
                        color: '#b91c1c',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Excluir Turma"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: MINHAS RESERVAS */}
      {subTab === 'RESERVATIONS' && (() => {
        const userEmail = currentUser?.email?.toLowerCase() || '';
        const userName = currentUser?.name?.toLowerCase() || '';

        const myAllocations = [];
        spaces.forEach(sp => {
          (sp.scheduleToday || []).forEach(alloc => {
            const teacherName = (alloc.teacher || '').toLowerCase();
            if (teacherName.includes(userName) || (userEmail && teacherName.includes(userEmail.split('@')[0]))) {
              myAllocations.push({ ...alloc, spaceName: sp.name, spaceType: sp.type, spaceBlock: sp.block, spaceId: sp.id });
            }
          });
        });

        const active = [];
        const upcoming = [];
        const past = [];
        const nowMins = nowInMinutes();
        const todayStr = todayDateString();

        myAllocations.forEach(r => {
          const startM = timeToMinutes(r.startTime);
          const endM = timeToMinutes(r.endTime);
          const rDate = r.date || todayStr;

          if (rDate > todayStr) {
            upcoming.push(r);
          } else if (rDate < todayStr) {
            past.push(r);
          } else {
            if (nowMins >= startM && nowMins < endM) active.push(r);
            else if (nowMins < startM) upcoming.push(r);
            else past.push(r);
          }
        });

        const ReservationCard = ({ r, highlight }) => (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '0.75rem',
            border: `1px solid ${highlight === 'active' ? '#bbf7d0' : highlight === 'upcoming' ? '#bae6fd' : '#e2e8f0'}`,
            padding: '1.25rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0369a1', backgroundColor: '#e0f2fe', padding: '0.2rem 0.5rem', borderRadius: '0.25rem' }}>
                {r.spaceType}
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: highlight === 'active' ? '#166534' : highlight === 'upcoming' ? '#0369a1' : '#64748b' }}>
                🕒 {r.startTime} - {r.endTime}
              </span>
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f2942', margin: 0 }}>
              {r.spaceName}
            </h3>

            <div style={{ fontSize: '0.8rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div>📚 <strong>Turma:</strong> {r.class}</div>
              <div>👥 <strong>Alunos:</strong> {r.students} alunos</div>
              <div>📅 <strong>Data:</strong> {r.date || todayStr}</div>
            </div>
          </div>
        );

        return (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f2942', margin: 0 }}>
                Minhas Alocações & Agendamentos
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
                Todas as reservas registradas em seu nome ({currentUser?.name || 'Docente'})
              </p>
            </div>

            {myAllocations.length === 0 ? (
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '3rem 2rem', textAlign: 'center' }}>
                <Calendar size={40} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#334155', margin: 0 }}>Você não possui alocações ativas</h3>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.4rem' }}>
                  Acesse o Mapa Interativo para agendar horários em salas de aula ou laboratórios.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {active.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#15803d', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>EM ANDAMENTO AGORA</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                      {active.map(r => <ReservationCard key={r.id} r={r} highlight="active" />)}
                    </div>
                  </div>
                )}

                {upcoming.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#1d4ed8', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>PRÓXIMAS RESERVAS</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                      {upcoming.map(r => <ReservationCard key={r.id} r={r} highlight="upcoming" />)}
                    </div>
                  </div>
                )}

                {past.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>CONCLUÍDAS HOJE</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                      {past.map(r => <ReservationCard key={r.id} r={r} highlight="past" />)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* Modal Edit Space */}
      {spaceToEdit && (
        <ModalEditSpace
          space={spaceToEdit}
          onClose={() => setSpaceToEdit(null)}
          onSave={(updatedSpaceData) => {
            onUpdateSpace(updatedSpaceData);
            setSpaceToEdit(null);
          }}
        />
      )}
    </div>
  );
}
