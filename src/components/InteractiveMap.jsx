import React, { useRef, useState, useEffect, useCallback } from 'react';
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

// Posição horizontal (cx, no viewBox de 1080 de largura do SchoolMap) de cada
// sala — usada só pra rolar o mapa até a sala encontrada por uma busca/filtro
// em telas estreitas. Espelha roomCoordinates de SchoolMap.jsx.
const MAP_VIEWBOX_WIDTH = 1080;
const ROOM_CX = {
  'lab-info': 160, 'lab-ciencias': 370, quadra: 640, teatro: 910,
  'sala-01': 110, 'sala-02': 275, 'sala-03': 440, 'sala-04': 605, 'sala-05': 770, 'sala-06': 935,
  biblioteca: 300, auditorio: 680
};

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

export default function InteractiveMap({ spaces, selectedSpace, setSelectedSpace, searchQuery, setSearchQuery, selectedDate, setSelectedDate, selectedTime, setSelectedTime, onResetToNow, isManualMoment = false }) {
  const isMobile = useIsMobile();
  const hasSearchActive = searchQuery && searchQuery.trim() !== '';
  
  // Encontra todas as salas que correspondem à busca
  const matchingSpaces = spaces.filter(space => checkSpaceMatchesQuery(space, searchQuery));
  const matchingSpaceIds = matchingSpaces.map(s => s.id);

  // --- Navegação horizontal do mapa em mobile ---
  const mapScrollRef = useRef(null);
  const [scrollEdges, setScrollEdges] = useState({ canLeft: false, canRight: false });
  const [hasUserScrolled, setHasUserScrolled] = useState(false);

  const updateScrollEdges = useCallback(() => {
    const el = mapScrollRef.current;
    if (!el) return;
    setScrollEdges({
      canLeft: el.scrollLeft > 8,
      canRight: el.scrollLeft + el.clientWidth < el.scrollWidth - 8
    });
  }, []);

  useEffect(() => {
    updateScrollEdges();
    window.addEventListener('resize', updateScrollEdges);
    return () => window.removeEventListener('resize', updateScrollEdges);
  }, [isMobile, updateScrollEdges]);

  // Quando uma busca/filtro encontra salas, rola o mapa até a primeira (mais à
  // esquerda) — sem isso, o resultado pode ficar fora da tela e o usuário acha
  // que o filtro não funcionou.
  useEffect(() => {
    if (!isMobile || !hasSearchActive) return;
    const el = mapScrollRef.current;
    if (!el) return;
    const xs = matchingSpaceIds.map(id => ROOM_CX[id]).filter(x => x != null);
    if (xs.length === 0) return;
    const scale = el.scrollWidth / MAP_VIEWBOX_WIDTH;
    const left = Math.max(0, Math.min(...xs) * scale - el.clientWidth / 2);
    el.scrollTo({ left, behavior: 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, isMobile]);

  return (
    <div style={{ padding: isMobile ? '1rem 1rem 5rem 1rem' : '1.5rem 2rem', flex: 1, overflowY: 'auto' }}>
      {/* Top Section Header with Title and Date Picker.
          Em mobile fica compacto (título menor, sem subtítulo, data/hora/Agora
          numa linha só) pra o mapa aparecer sem precisar rolar a página. */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', justifyContent: 'space-between', marginBottom: isMobile ? '0.75rem' : '1rem', flexWrap: 'wrap', gap: isMobile ? '0.6rem' : '1rem' }}>
        <div>
          <h1 style={{ fontSize: isMobile ? '1.1rem' : '1.35rem', fontWeight: 800, color: '#0f2942', letterSpacing: '-0.02em', margin: 0 }}>
            Planta Baixa Interativa do Colégio
          </h1>
          {!isMobile && (
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
              Controle e acompanhamento de disponibilidade em tempo real
            </p>
          )}
        </div>

        {/* Date + Time Selectors */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.4rem' : '0.6rem', flexWrap: isMobile ? 'nowrap' : 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '0.5rem',
            padding: isMobile ? '0.4rem 0.6rem' : '0.45rem 0.9rem',
            fontSize: '0.85rem',
            color: '#334155',
            fontWeight: 600,
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            flex: isMobile ? '1 1 0' : 'none',
            minWidth: 0
          }}>
            <Calendar size={16} color="#0f2942" style={{ flexShrink: 0 }} />
            <input
              type="date"
              value={selectedDate || '2026-05-27'}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontFamily: 'inherit', fontWeight: 600, color: '#0f2942', cursor: 'pointer', minWidth: 0, width: isMobile ? '100%' : 'auto', fontSize: isMobile ? '0.8rem' : 'inherit' }}
            />
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '0.5rem',
            padding: isMobile ? '0.4rem 0.6rem' : '0.45rem 0.9rem',
            fontSize: '0.85rem',
            color: '#334155',
            fontWeight: 600,
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            flex: isMobile ? '0 1 auto' : 'none',
            minWidth: 0
          }}>
            <Clock size={16} color="#0f2942" style={{ flexShrink: 0 }} />
            <input
              type="time"
              value={selectedTime || ''}
              onChange={(e) => setSelectedTime(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontFamily: 'inherit', fontWeight: 600, color: '#0f2942', cursor: 'pointer', minWidth: 0, width: isMobile ? '4.5rem' : 'auto', fontSize: isMobile ? '0.8rem' : 'inherit' }}
            />
          </div>

          <button
            onClick={onResetToNow}
            title="Voltar para a data e hora atuais"
            aria-label="Voltar para a data e hora atuais"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0,
              backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '0.5rem',
              padding: isMobile ? '0.5rem' : '0.45rem 0.8rem', fontSize: '0.8rem', fontWeight: 700, color: '#334155',
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={isMobile ? 16 : 14} />
            {!isMobile && 'Agora'}
          </button>
        </div>
      </div>

      {/* Só aparece quando o usuário fixou uma data/hora — no modo padrão o mapa
          acompanha o relógio ("ao vivo"). */}
      {isManualMoment && (
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.78rem', color: '#0369a1', fontWeight: 600, margin: '-0.25rem 0 0.9rem 0' }}>
          <span>🕒 Mostrando {formatDateBR(selectedDate)} às {selectedTime}</span>
          <button
            onClick={onResetToNow}
            style={{ border: '1px solid #93c5fd', backgroundColor: '#ffffff', color: '#0284c7', borderRadius: '0.375rem', padding: '0.2rem 0.6rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
          >
            Voltar para agora
          </button>
        </div>
      )}

      {/* Quick Filter Chips (Atalhos Clicáveis de Pesquisa Rápida) */}
      {/* Em mobile vira uma única faixa com rolagem horizontal (em vez de 4
          linhas de chips empurrando o mapa pra baixo da dobra). */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: isMobile ? 'nowrap' : 'wrap', overflowX: isMobile ? 'auto' : 'visible', WebkitOverflowScrolling: 'touch', marginBottom: isMobile ? '0.75rem' : '1.25rem', paddingBottom: isMobile ? '0.25rem' : 0 }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem', marginRight: '0.25rem', flexShrink: 0, whiteSpace: 'nowrap' }}>
          <Filter size={13} color="#64748b" />
          {!isMobile && 'Filtros Rápido:'}
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
                flexShrink: 0,
                whiteSpace: 'nowrap',
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
        padding: isMobile ? '0.75rem' : '1.25rem 1.5rem',
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
          gap: isMobile ? '0.5rem' : '1.5rem',
          flexWrap: 'wrap',
          marginBottom: isMobile ? '0.5rem' : '1rem',
          paddingBottom: isMobile ? '0.5rem' : '0.75rem',
          borderBottom: '1px solid #f1f5f9'
        }}>
          <div style={{ fontSize: isMobile ? '0.65rem' : '0.75rem', fontWeight: 800, color: '#334155', letterSpacing: '0.06em', marginRight: isMobile ? 0 : '1rem' }}>
            MAPA UNIFICADO DO CAMPUS ESCOLAR
          </div>

          {/* Status Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.9rem' : '1.5rem', fontSize: isMobile ? '0.72rem' : '0.825rem', flexWrap: 'wrap' }}>
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
        {/* Wrapper externo: guarda os indicadores de rolagem (esmaecido nas
            bordas + dica) fixos, sem rolarem junto com o mapa. */}
        <div style={{ position: 'relative', width: '100%' }}>
          <div
            ref={mapScrollRef}
            onScroll={() => {
              updateScrollEdges();
              if (!hasUserScrolled) setHasUserScrolled(true);
            }}
            style={{
              position: 'relative',
              width: '100%',
              minHeight: '440px',
              overflowX: isMobile ? 'auto' : 'visible',
              WebkitOverflowScrolling: 'touch'
            }}
          >
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

          {isMobile && scrollEdges.canLeft && (
            <div aria-hidden="true" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '28px', pointerEvents: 'none', background: 'linear-gradient(to right, rgba(255,255,255,0.95), rgba(255,255,255,0))' }} />
          )}
          {isMobile && scrollEdges.canRight && (
            <div aria-hidden="true" style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '28px', pointerEvents: 'none', background: 'linear-gradient(to left, rgba(255,255,255,0.95), rgba(255,255,255,0))' }} />
          )}

          {/* Dica de rolagem — some depois do primeiro movimento do usuário */}
          {isMobile && !hasUserScrolled && scrollEdges.canRight && (
            <div style={{
              position: 'absolute', left: '50%', bottom: '0.75rem', transform: 'translateX(-50%)',
              backgroundColor: 'rgba(15,41,66,0.88)', color: '#ffffff',
              fontSize: '0.72rem', fontWeight: 700, padding: '0.35rem 0.8rem',
              borderRadius: '9999px', pointerEvents: 'none', whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}>
              ↔ Arraste para os lados para ver o mapa todo
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
