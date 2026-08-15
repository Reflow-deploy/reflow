import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Clock, Users, Calendar, Trash2, Siren, Cpu, Edit3, Save, Wrench, AlertTriangle } from 'lucide-react';
import { useIsMobile } from '../utils/useIsMobile';

const AVAILABLE_EQUIPMENTS = [
  'Projetor',
  'Ar-condicionado',
  'Lousa Digital',
  'Computadores',
  'Sistema de Som',
  'Microfone',
  'Wi-Fi de Alta Velocidade'
];

const DESK_TYPES = [
  { value: 'Grupo', label: '👥 Mesas em Grupo (Bancadas)' },
  { value: 'Individual', label: '🪑 Mesas Individuais' },
  { value: 'Mista', label: '🔄 Layout Misto' }
];

export default function SpaceDrawer({ 
  space, 
  onClose, 
  onAllocate, 
  onCancelReservation, 
  onRequestOccurrence = () => {},
  currentDate,
  isAdmin = false,
  onUpdateSpaceFeatures = () => {}
}) {
  // Todos os hooks precisam vir ANTES de qualquer return condicional (Regras
  // de Hooks do React) — o componente já violava isso antes desta mudança
  // (o "if (!space) return null" vinha antes dos hooks abaixo), o que não
  // travava visivelmente porque a checagem de dev do React (que avisa sobre
  // hook count mudando entre renders) não existe no build de produção; o
  // efeito real ainda acontecia (corrupção de estado), só sem aviso. Ao
  // adicionar useIsMobile(), a contagem de hooks mudou o suficiente pra virar
  // um crash visível (tela branca) ao clicar numa sala. Corrigindo aqui.
  const isMobile = useIsMobile();
  const [isEditing, setIsEditing] = useState(false);
  const [equipments, setEquipments] = useState(space?.equipments || ['Projetor', 'Ar-condicionado', 'Lousa Digital']);
  const [deskType, setDeskType] = useState(space?.deskType || 'Individual');

  useEffect(() => {
    if (space) {
      setEquipments(space.equipments || ['Projetor', 'Ar-condicionado', 'Lousa Digital']);
      setDeskType(space.deskType || 'Individual');
      setIsEditing(false);
    }
  }, [space]);

  if (!space) return null;

  const isMaintenance = space.status === 'MANUTENCAO';
  const isOccupied = space.status === 'OCUPADO';

  const handleToggleEquipment = (item) => {
    if (equipments.includes(item)) {
      setEquipments(equipments.filter(e => e !== item));
    } else {
      setEquipments([...equipments, item]);
    }
  };

  const handleSaveFeatures = () => {
    onUpdateSpaceFeatures(space.id, { equipments, deskType });
    setIsEditing(false);
  };

  const getEquipmentIcon = (name) => {
    if (name.includes('Projetor')) return '📽️';
    if (name.includes('Ar-condicionado')) return '❄️';
    if (name.includes('Lousa')) return '🖊️';
    if (name.includes('Computador')) return '🖥️';
    if (name.includes('Som')) return '🔊';
    if (name.includes('Microfone')) return '🎙️';
    if (name.includes('Wi-Fi')) return '📡';
    return '📦';
  };

  return (
    <aside className="animate-slide-in-right" style={{
      width: isMobile ? '100%' : '390px',
      height: 'calc(100vh - 70px)',
      backgroundColor: '#ffffff',
      borderLeft: isMobile ? 'none' : '1px solid #e2e8f0',
      boxShadow: '-4px 0 16px rgba(0, 0, 0, 0.05)',
      position: 'fixed',
      right: 0,
      top: '70px',
      zIndex: 45,
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      overflowY: 'auto'
    }}>
      <div>
        {/* Drawer Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>
            <Clock size={16} color="#64748b" />
            Painel do Espaço
          </div>
          <button 
            onClick={onClose}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0.2rem' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Space Tags & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            color: '#475569',
            backgroundColor: '#f1f5f9',
            padding: '0.2rem 0.6rem',
            borderRadius: '0.25rem',
            textTransform: 'uppercase'
          }}>
            {space.type}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Users size={14} />
            Máx: {space.capacity} alunos
          </span>
        </div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f2942', marginBottom: '0.35rem' }}>
          {space.name}
        </h2>

        {currentDate && (
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Clock size={13} color="#94a3b8" />
            Situação em: {currentDate}
          </div>
        )}

        {/* Status Indicator Banner */}
        {isMaintenance ? (
          <div style={{
            backgroundColor: '#fff7ed',
            border: '1px solid #ffedd5',
            color: '#c2410c',
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            fontWeight: 600,
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            marginBottom: '1.25rem'
          }}>
            <Wrench size={18} color="#c2410c" />
            Em Manutenção / Interditada
          </div>
        ) : isOccupied ? (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            fontWeight: 600,
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            marginBottom: '1.25rem'
          }}>
            <Clock size={18} color="#b91c1c" />
            Ocupada no Momento
          </div>
        ) : (
          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#166534',
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            fontWeight: 600,
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            marginBottom: '1.25rem'
          }}>
            <CheckCircle size={18} color="#15803d" />
            Livre e Disponível
          </div>
        )}

        {/* RECURSOS & INFRAESTRUTURA SECTION */}
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '0.6rem',
          padding: '1rem',
          marginBottom: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f2942', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Cpu size={14} color="#0b2238" />
              Recursos & Mobiliário
            </div>
            {isAdmin && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  border: 'none',
                  background: 'none',
                  color: '#0369a1',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem'
                }}
              >
                <Edit3 size={13} />
                Editar
              </button>
            )}
          </div>

          {isEditing ? (
            /* Editing Mode for Admin */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem' }}>
                  Tipo de Mesas dos Alunos:
                </label>
                <select
                  value={deskType}
                  onChange={(e) => setDeskType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.4rem 0.6rem',
                    fontSize: '0.8rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff'
                  }}
                >
                  {DESK_TYPES.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem' }}>
                  Objetos / Equipamentos Disponíveis:
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {AVAILABLE_EQUIPMENTS.map(item => {
                    const isChecked = equipments.includes(item);
                    return (
                      <label key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#334155', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleEquipment(item)}
                        />
                        <span>{getEquipmentIcon(item)} {item}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  onClick={() => setIsEditing(false)}
                  style={{
                    flex: 1,
                    padding: '0.4rem',
                    fontSize: '0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveFeatures}
                  style={{
                    flex: 1,
                    padding: '0.4rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: '0.375rem',
                    border: 'none',
                    backgroundColor: '#0f2942',
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <Save size={13} />
                  Salvar no Banco
                </button>
              </div>
            </div>
          ) : (
            /* View Mode */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {/* Desk Type Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>DISPOSIÇÃO DAS MESAS:</span>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: deskType === 'Grupo' ? '#0369a1' : '#334155',
                  backgroundColor: deskType === 'Grupo' ? '#e0f2fe' : '#f1f5f9',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '0.375rem'
                }}>
                  {deskType === 'Grupo' ? '👥 Mesas em Grupo (Bancadas)' : deskType === 'Individual' ? '🪑 Mesas Individuais' : '🔄 Layout Misto'}
                </span>
              </div>

              {/* Equipment Badges */}
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: '0.4rem' }}>
                  OBJETOS & EQUIPAMENTOS:
                </span>
                {equipments && equipments.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {equipments.map(eq => (
                      <span key={eq} style={{
                        fontSize: '0.73rem',
                        fontWeight: 600,
                        color: '#1e293b',
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '0.375rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <span>{getEquipmentIcon(eq)}</span>
                        <span>{eq}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                    Nenhum equipamento cadastrado.
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Current Activity Details (If Occupied) */}
        {isOccupied && space.currentAllocation && (
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '1.25rem'
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
              ATIVIDADE CORRENTE
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>RESPONSÁVEL</span>
                <div style={{ fontWeight: 600, color: '#1e293b' }}>{space.currentAllocation.teacher}</div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>TURMA</span>
                <div style={{ fontWeight: 600, color: '#1e293b' }}>{space.currentAllocation.class}</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>ALUNOS AGENDADOS</span>
                  <div style={{ fontWeight: 600, color: '#1e293b' }}>👥 {space.currentAllocation.students} alunos</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>HORÁRIO</span>
                  <div style={{ fontWeight: 600, color: '#1e293b' }}>🕒 {space.currentAllocation.startTime} - {space.currentAllocation.endTime}</div>
                </div>
              </div>
            </div>
          </div>
        )}


      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
        {isMaintenance ? (
          <button
            disabled
            style={{
              backgroundColor: '#f1f5f9',
              color: '#94a3b8',
              fontWeight: 600,
              fontSize: '0.875rem',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid #cbd5e1',
              cursor: 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <AlertTriangle size={18} color="#94a3b8" />
            Sala Indisponível (Em Manutenção)
          </button>
        ) : (
          <button
            onClick={() => onAllocate(space)}
            style={{
              backgroundColor: '#0b2238',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.875rem',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'background-color 0.2s'
            }}
          >
            <Calendar size={18} />
            {isOccupied ? 'Alocar Outro Horário' : 'Alocar Espaço (Rápido)'}
          </button>
        )}

        <button
          onClick={() => onRequestOccurrence(space)}
          style={{
            backgroundColor: '#fff5f5',
            color: '#b91c1c',
            border: '1px solid #fee2e2',
            fontWeight: 600,
            fontSize: '0.875rem',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s'
          }}
        >
          <Siren size={18} color="#b91c1c" />
          Reportar Problema / Limpeza nesta Sala
        </button>

        {isOccupied && (
          <button
            onClick={() => onCancelReservation(space.id, space.currentAllocation?.id)}
            style={{
              backgroundColor: '#b91c1c',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.875rem',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'background-color 0.2s'
            }}
          >
            <Trash2 size={18} />
            Cancelar Reserva
          </button>
        )}
      </div>
    </aside>
  );
}
