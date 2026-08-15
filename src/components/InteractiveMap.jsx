import React from 'react';
import { Calendar, Search, X, Sparkles, Filter, Clock, RotateCcw } from 'lucide-react';
import SchoolMap from './SchoolMap';
import { useIsMobile } from '../utils/useIsMobile';
import { todayDateString } from '../utils/spaceStatus';

// Reformatação pura de "YYYY-MM-DD" -> "DD/MM/YYYY" (mesmo helper de
// App.jsx, replicado aqui — pequena duplicação já aceita no projeto pra
// helpers puros de data, evita subir mais uma prop calculada).
function formatDateBR(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

const QUICK_FILTERS = [
  { label: '✨ Todos', query: '' },
  { label: '🟢 Livres', query: 'LIVRE' },
  { label: '📽️ Projetor', query: 'Projetor' },
  { label: '❄️ Ar-condicionado', query: 'Ar-condicionado' },
  { label: '💻 Computadores', query: 'Computadores' },
  { label: '👥 Mesas em Grupo', query: 'Grupo' },
  { label: '🪑 Mesas Individuais', query: 'Individual' },
  { label: '🖊️ Lousa Digital', query: 'Lousa' }
];

export function checkSpaceMatchesQuery(space, query) {
  if (!query || query.trim() === '') return true;
  const q = query.trim().toLowerCase();

  // 1. Status exato (Filtro 'LIVRE', 'OCUPADO', 'MANUTENCAO')
  if (q === 'livre') return space.status === 'LIVRE';
  if (q === 'ocupado') return space.status === 'OCUPADO';
  if (q === 'manutenção' || q === 'manutencao') return space.status === 'MANUTENCAO';

  // 2. Disposição de Mesas
  if (q === 'grupo' || q === 'bancada' || q === 'bancadas') {
    if ((space.deskType || '').toLowerCase().includes('grupo')) return true;
  }
  if (q === 'individual' || q === 'individuais') {
    if ((space.deskType || '').toLowerCase().includes('individual')) return true;
  }

  // 3. Equipamentos & Objetos
  if (space.equipments && space.equipments.length > 0) {
    const matchEquip = space.equipments.some(eq => eq.toLowerCase().includes(q));
    if (matchEquip) return true;
  }

  // 4. Nome da Sala, Tipo, Bloco ou Status textual
  if ((space.name || '').toLowerCase().includes(q)) return true;
  if ((space.type || '').toLowerCase().includes(q)) return true;
  if ((space.block || '').toLowerCase().includes(q)) return true;
  if ((space.status || '').toLowerCase().includes(q)) return true;

  // 5. Professores e Turmas alocados no momento ou agendados
  if (space.currentAllocation) {
    if ((space.currentAllocation.teacher || '').toLowerCase().includes(q)) return true;
    if ((space.currentAllocation.class || '').toLowerCase().includes(q)) return true;
  }
  if (space.scheduleToday && space.scheduleToday.length > 0) {
    const matchSchedule = space.scheduleToday.some(alloc => 
      (alloc.teacher || '').toLowerCase().includes(q) ||
      (alloc.class || '').toLowerCase().includes(q)
    );
    if (matchSchedule) return true;
  }

  // 6. Capacidade (Busca numérica ou textual)
  if (!isNaN(q)) {
    const num = Number(q);
    if (space.capacity === num || (num <= 100 && space.capacity >= num)) return true;
  }

  return false;
}

export default function InteractiveMap({ spaces, selectedSpace, setSelectedSpace, searchQuery, setSearchQuery, selectedDate, setSelectedDate, selectedTime, setSelectedTime, onResetToNow }) {
  const isMobile = useIsMobile();
  const hasSearchActive = searchQuery && searchQuery.trim() !== '';
  
  // Encontra todas as salas que correspondem à busca
  const matchingSpaces = spaces.filter(space => checkSpaceMatchesQuery(space, searchQuery));
  const matchingSpaceIds = matchingSpaces.map(s => s.id);

  return (
    <div style={{ padding: '1.5rem 2rem', flex: 1, overflowY: 'auto' }}>
      {/* Top Section Header with Title and Date Picker */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f2942', letterSpacing: '-0.02em', margin: 0 }}>
            Planta Baixa Interativa do Colégio
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
            Controle e acompanhamento de disponibilidade em tempo real
          </p>
        </div>

        {/* Date + Time Selectors */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '0.5rem',
            padding: '0.45rem 0.9rem',
            fontSize: '0.85rem',
            color: '#334155',
            fontWeight: 600,
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
          }}>
            <Calendar size={16} color="#0f2942" />
            <input
              type="date"
              value={selectedDate || '2026-05-27'}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontFamily: 'inherit', fontWeight: 600, color: '#0f2942', cursor: 'pointer' }}
            />
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '0.5rem',
            padding: '0.45rem 0.9rem',
            fontSize: '0.85rem',
            color: '#334155',
            fontWeight: 600,
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
          }}>
            <Clock size={16} color="#0f2942" />
            <input
              type="time"
              value={selectedTime || ''}
              onChange={(e) => setSelectedTime(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontFamily: 'inherit', fontWeight: 600, color: '#0f2942', cursor: 'pointer' }}
            />
          </div>

          <button
            onClick={onResetToNow}
            title="Voltar para a data e hora atuais"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '0.5rem',
              padding: '0.45rem 0.8rem', fontSize: '0.8rem', fontWeight: 700, color: '#334155',
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={14} />
            Agora
          </button>
        </div>
      </div>

      {selectedDate !== todayDateString() && (
        <p style={{ fontSize: '0.78rem', color: '#0369a1', fontWeight: 600, margin: '-0.5rem 0 1rem 0' }}>
          🕒 Mostrando status para {formatDateBR(selectedDate)} às {selectedTime}
        </p>
      )}

      {/* Quick Filter Chips (Atalhos Clicáveis de Pesquisa Rápida) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem', marginRight: '0.25rem' }}>
          <Filter size={13} color="#64748b" />
          Filtros Rápido:
        </span>
        {QUICK_FILTERS.map(chip => {
          const isActive = (chip.query === '' && searchQuery === '') || (chip.query !== '' && searchQuery.toLowerCase() === chip.query.toLowerCase());
          return (
            <button
              key={chip.label}
              onClick={() => setSearchQuery(chip.query)}
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.35rem 0.75rem',
                borderRadius: '9999px',
                border: isActive ? '1.5px solid #0f2942' : '1px solid #e2e8f0',
                backgroundColor: isActive ? '#0f2942' : '#ffffff',
                color: isActive ? '#ffffff' : '#334155',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? '0 2px 6px rgba(15,41,66,0.2)' : 'none'
              }}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Active Search Results Banner */}
      {hasSearchActive && (
        <div style={{
          backgroundColor: '#e0f2fe',
          border: '1px solid #bae6fd',
          borderRadius: '0.5rem',
          padding: '0.6rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
          fontSize: '0.85rem',
          color: '#0369a1'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
            <Sparkles size={16} color="#0284c7" />
            <span>
              {matchingSpaces.length} {matchingSpaces.length === 1 ? 'sala encontrada' : 'salas encontradas'} para "{searchQuery}"
            </span>
          </div>
          <button
            onClick={() => setSearchQuery('')}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #93c5fd',
              color: '#0284c7',
              borderRadius: '0.375rem',
              padding: '0.25rem 0.6rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <X size={13} />
            Limpar Busca
          </button>
        </div>
      )}

      {/* Main Outer White Card Container */}
      <div className="card-reflow" style={{
        padding: '1.25rem 1.5rem',
        backgroundColor: '#ffffff',
        borderRadius: '0.75rem',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)'
      }}>
        {/* Card Header with Title & Legend */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          gap: '1.5rem',
          flexWrap: 'wrap',
          marginBottom: '1rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid #f1f5f9'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155', letterSpacing: '0.06em', marginRight: '1rem' }}>
            MAPA UNIFICADO DO CAMPUS ESCOLAR
          </div>

          {/* Status Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.825rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#166534', fontWeight: 700 }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '9999px', backgroundColor: '#16a34a', display: 'inline-block' }}></span>
              Livre
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#991b1b', fontWeight: 700 }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '9999px', backgroundColor: '#dc2626', display: 'inline-block' }}></span>
              Ocupado
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#d97706', fontWeight: 700 }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '9999px', backgroundColor: '#d97706', display: 'inline-block' }}></span>
              Manutenção
            </div>
          </div>
        </div>

        {/* 3D Isometric SVG Map Canvas */}
        <div style={{
          position: 'relative',
          width: '100%',
          minHeight: '440px',
          overflowX: isMobile ? 'auto' : 'visible',
          WebkitOverflowScrolling: 'touch'
        }}>
          {/* Em mobile, o SVG não pode encolher abaixo de uma largura
              legível — em vez de deixar width:100% (CSS) minimizar o mapa
              inteiro até caber na tela (o que miniaturiza demais o texto
              dos foreignObject de cada sala), forçamos uma largura mínima
              e deixamos o container acima rolar horizontalmente por toque. */}
          <div style={{ minWidth: isMobile ? '900px' : '100%' }}>
            <SchoolMap
              spaces={spaces}
              selectedSpaceId={selectedSpace?.id}
              onSpaceSelect={setSelectedSpace}
              matchingSpaceIds={matchingSpaceIds}
              hasSearchActive={hasSearchActive}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
