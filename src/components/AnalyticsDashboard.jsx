import React, { useMemo } from 'react';
import { BarChart3, AlertTriangle, Clock, Percent, Building2, CalendarClock } from 'lucide-react';
import { useIsMobile } from '../utils/useIsMobile';
import { timeToMinutes } from '../utils/spaceStatus';

// Faixas de horário usadas só nesta tela, pra agrupar a ocupação por bloco —
// não existe essa convenção em nenhum outro lugar do sistema hoje.
const TIME_BANDS = [
  { label: 'Manhã', start: '07:00', end: '12:00' },
  { label: 'Tarde', start: '12:00', end: '18:00' },
  { label: 'Noite', start: '18:00', end: '22:00' }
];

function formatDuration(ms) {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return '—';
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remMin = minutes % 60;
  if (hours < 24) return remMin > 0 ? `${hours}h ${remMin}min` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours > 0 ? `${days}d ${remHours}h` : `${days} dia${days === 1 ? '' : 's'}`;
}

function computeAvgResolutionMs(occurrences) {
  const resolved = occurrences.filter(o => o.status === 'RESOLVIDO' && o.resolvedAt && o.createdAt);
  if (resolved.length === 0) return null;
  const durations = resolved
    .map(o => new Date(o.resolvedAt) - new Date(o.createdAt))
    .filter(ms => Number.isFinite(ms) && ms >= 0);
  return durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : null;
}

function computeReportedRanking(occurrences) {
  const counts = {};
  occurrences.forEach(o => {
    const key = o.spaceId;
    if (!key) return;
    if (!counts[key]) counts[key] = { spaceId: key, spaceName: o.spaceName || key, count: 0 };
    counts[key].count += 1;
  });
  return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 10);
}

function todayDateStringLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function computeOccupancyGrid(spaces, allocations) {
  const today = todayDateStringLocal();
  const blocks = [...new Set(spaces.map(s => s.block).filter(Boolean))];
  const todaysAllocations = allocations.filter(a => (a.date || today) === today);

  return blocks.map(block => {
    const blockSpaces = spaces.filter(s => s.block === block);
    const blockSpaceIds = new Set(blockSpaces.map(s => s.id));
    const cells = TIME_BANDS.map(band => {
      const bandStart = timeToMinutes(band.start);
      const bandEnd = timeToMinutes(band.end);
      const occupiedSpaceIds = new Set(
        todaysAllocations
          .filter(a => blockSpaceIds.has(a.spaceId))
          .filter(a => timeToMinutes(a.startTime) < bandEnd && timeToMinutes(a.endTime) > bandStart)
          .map(a => a.spaceId)
      );
      const pct = blockSpaces.length > 0 ? Math.round((occupiedSpaceIds.size / blockSpaces.length) * 100) : 0;
      return { ...band, pct, occupied: occupiedSpaceIds.size, total: blockSpaces.length };
    });
    return { block, cells, totalSpaces: blockSpaces.length };
  });
}

function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#94a3b8' }}>
      <Icon size={40} color="#94a3b8" style={{ margin: '0 auto 0.75rem auto' }} />
      <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#334155', margin: 0 }}>{title}</h3>
      {subtitle && <p style={{ fontSize: '0.8rem', margin: '0.35rem 0 0 0' }}>{subtitle}</p>}
    </div>
  );
}

function KpiTile({ icon: Icon, label, value, valueColor, footnote }) {
  return (
    <div className="card-reflow" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </span>
        <Icon size={16} color="#94a3b8" />
      </div>
      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: valueColor || '#0f2942' }}>
        {value}
      </div>
      {footnote && <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>{footnote}</div>}
    </div>
  );
}

export default function AnalyticsDashboard({ spaces = [], occurrences = [], allocations = [] }) {
  const isMobile = useIsMobile();

  const openCount = useMemo(
    () => occurrences.filter(o => (o.status || 'ABERTO') !== 'RESOLVIDO').length,
    [occurrences]
  );

  const avgResolutionMs = useMemo(() => computeAvgResolutionMs(occurrences), [occurrences]);
  const reportedRanking = useMemo(() => computeReportedRanking(occurrences), [occurrences]);
  const occupancyGrid = useMemo(() => computeOccupancyGrid(spaces, allocations), [spaces, allocations]);

  const occupiedCount = spaces.filter(s => s.status === 'OCUPADO').length;
  const occupancyPct = spaces.length > 0 ? Math.round((occupiedCount / spaces.length) * 100) : 0;

  const maxReported = reportedRanking.length > 0 ? reportedRanking[0].count : 0;
  const hasAllocationsToday = occupancyGrid.some(row => row.cells.some(c => c.occupied > 0));

  return (
    <div style={{ padding: isMobile ? '1.25rem' : '1.5rem 2rem', flex: 1, overflowY: 'auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f2942', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <BarChart3 size={22} />
          Dashboard
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
          Visão geral de ocorrências e ocupação de salas
        </p>
      </div>

      {/* KPI tiles */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <KpiTile
          icon={AlertTriangle}
          label="Ocorrências Abertas"
          value={openCount}
          valueColor={openCount > 0 ? '#b91c1c' : '#15803d'}
        />
        <KpiTile
          icon={Clock}
          label="Tempo Médio de Resolução"
          value={avgResolutionMs != null ? formatDuration(avgResolutionMs) : '—'}
          footnote={avgResolutionMs == null ? 'Nenhuma ocorrência resolvida ainda' : undefined}
        />
        <KpiTile
          icon={Percent}
          label="Taxa de Ocupação Geral"
          value={`${occupancyPct}%`}
          footnote={`${occupiedCount} de ${spaces.length} salas`}
        />
      </div>

      {/* Salas mais reportadas */}
      <div className="card-reflow" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#18181b', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Building2 size={17} />
          Salas Mais Reportadas
        </h2>
        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 1rem 0' }}>
          Ranking de salas por quantidade de ocorrências registradas (todas, não só abertas)
        </p>

        {reportedRanking.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="Nenhuma ocorrência reportada ainda"
            subtitle="O ranking de salas aparece aqui assim que houver chamados registrados."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {reportedRanking.map(item => (
              <div key={item.spaceId} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#334155', width: isMobile ? '90px' : '160px', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.spaceName}
                </span>
                <div style={{ flex: 1, backgroundColor: '#e2e8f0', borderRadius: '9999px', height: '10px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${maxReported > 0 ? (item.count / maxReported) * 100 : 0}%`,
                    backgroundColor: '#0369a1',
                    height: '100%',
                    borderRadius: '9999px'
                  }} />
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f2942', width: '20px', textAlign: 'right', flexShrink: 0 }}>
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ocupação por bloco/horário */}
      <div className="card-reflow" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#18181b', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <CalendarClock size={17} />
          Taxa de Ocupação por Bloco/Horário
        </h2>
        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 1rem 0' }}>
          Baseado nas alocações de hoje — o sistema não guarda histórico de reservas passadas
        </p>

        {occupancyGrid.length === 0 || !hasAllocationsToday ? (
          <EmptyState
            icon={CalendarClock}
            title="Nenhuma sala alocada para hoje"
            subtitle="A ocupação por bloco e horário aparece aqui assim que houver reservas no dia."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {occupancyGrid.map(row => (
              <div key={row.block}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f2942', marginBottom: '0.4rem' }}>
                  {row.block} <span style={{ fontWeight: 500, color: '#94a3b8' }}>({row.totalSpaces} salas)</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  {row.cells.map(cell => (
                    <div key={cell.label} style={{
                      backgroundColor: `rgba(3, 105, 161, ${Math.max(cell.pct / 100, 0.06)})`,
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.5rem',
                      padding: '0.6rem 0.5rem',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: cell.pct > 55 ? '#ffffff' : '#334155' }}>
                        {cell.label}
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: cell.pct > 55 ? '#ffffff' : '#0f2942' }}>
                        {cell.pct}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
