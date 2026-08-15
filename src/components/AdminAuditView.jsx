import React, { useState, useMemo } from 'react';
import { ShieldCheck, ChevronUp, ChevronDown, RefreshCw } from 'lucide-react';

const ACTION_LABELS = {
  ROLE_CHANGE: 'Troca de Cargo',
  OCCURRENCE_DELETE: 'Exclusão de Ocorrência',
  SPACE_UPDATE: 'Edição de Sala',
  SPACE_DELETE: 'Exclusão de Sala'
};

const FIELD_LABELS = {
  system_role: 'Cargo',
  name: 'Nome',
  type: 'Tipo',
  capacity: 'Capacidade',
  block: 'Bloco',
  status: 'Status',
  equipments: 'Equipamentos',
  desk_type: 'Tipo de Mesa',
  svg_group_id: 'Grupo (mapa)'
};

function resolveActorName(log, collaborators) {
  if (!log.actorUserId) return 'Sistema';
  const match = collaborators.find(c => c.userId === log.actorUserId);
  if (match) return match.name;
  return `Usuário removido (${log.actorUserId.slice(0, 8)}…)`;
}

function formatChange(log) {
  const { action, oldData, newData } = log;
  if (action === 'ROLE_CHANGE') {
    return `${oldData?.system_role ?? '—'} → ${newData?.system_role ?? '—'}`;
  }
  if (action === 'SPACE_UPDATE' && oldData && newData) {
    const changedKeys = Object.keys(newData).filter(k => JSON.stringify(newData[k]) !== JSON.stringify(oldData[k]));
    if (changedKeys.length === 0) return 'Nenhum campo alterado';
    return changedKeys
      .map(k => `${FIELD_LABELS[k] || k}: ${JSON.stringify(oldData[k])} → ${JSON.stringify(newData[k])}`)
      .join(' · ');
  }
  if (action === 'OCCURRENCE_DELETE' && oldData) {
    return `${oldData.space_name || oldData.space_id} · ${oldData.failure_type || 'Falha não especificada'}`;
  }
  if (action === 'SPACE_DELETE' && oldData) {
    return `${oldData.name} · ${oldData.type || ''} · Cap. ${oldData.capacity ?? '—'}`;
  }
  return '—';
}

function formatDateTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export default function AdminAuditView({ logs = [], loading = false, collaborators = [] }) {
  const [sortDir, setSortDir] = useState('desc'); // asc | desc — por data/hora

  const sortedLogs = useMemo(() => {
    const copy = [...logs];
    copy.sort((a, b) => {
      const diff = new Date(a.createdAt) - new Date(b.createdAt);
      return sortDir === 'asc' ? diff : -diff;
    });
    return copy;
  }, [logs, sortDir]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#18181b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ShieldCheck size={17} />
            Auditoria Administrativa
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
            Registro imutável de trocas de cargo, exclusões de ocorrência e edições/exclusões de sala.
          </p>
        </div>
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.8rem' }}>
            <RefreshCw size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
            Carregando...
          </div>
        )}
      </div>

      {!loading && sortedLogs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#94a3b8' }}>
          <ShieldCheck size={52} color="#94a3b8" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#334155' }}>Nenhuma ação administrativa registrada ainda.</h3>
          <p style={{ fontSize: '0.875rem' }}>Trocas de cargo, exclusões de ocorrência e mudanças de sala vão aparecer aqui automaticamente.</p>
        </div>
      ) : (
        <div style={{
          border: '1px solid #e2e8f0',
          borderRadius: '0.5rem',
          overflow: 'hidden',
          backgroundColor: '#ffffff'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '150px 160px 160px 1fr',
            padding: '0.65rem 1rem',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.02em'
          }}>
            <button
              onClick={() => setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))}
              style={{
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.2rem',
                fontSize: 'inherit', fontWeight: 'inherit', color: 'inherit', textTransform: 'inherit'
              }}
            >
              Data/Hora
              {sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            <span>Ator</span>
            <span>Ação</span>
            <span>Antes → Depois</span>
          </div>

          {sortedLogs.map(log => (
            <details key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <summary style={{
                display: 'grid',
                gridTemplateColumns: '150px 160px 160px 1fr',
                padding: '0.65rem 1rem',
                fontSize: '0.8rem',
                color: '#334155',
                cursor: 'pointer',
                alignItems: 'center'
              }}>
                <span style={{ color: '#64748b' }}>{formatDateTime(log.createdAt)}</span>
                <span style={{ fontWeight: 600 }}>{resolveActorName(log, collaborators)}</span>
                <span>{ACTION_LABELS[log.action] || log.action}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {formatChange(log)}
                </span>
              </summary>
              <div style={{
                padding: '0.75rem 1rem 1rem 1rem',
                backgroundColor: '#f8fafc',
                fontSize: '0.75rem',
                color: '#475569'
              }}>
                <div style={{ marginBottom: '0.35rem', fontWeight: 600 }}>Alvo: {log.targetLabel || log.targetId} ({log.targetTable})</div>
                <pre style={{
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.375rem',
                  padding: '0.5rem 0.65rem',
                  fontFamily: "'JetBrains Mono', monospace"
                }}>
                  {JSON.stringify({ old: log.oldData, new: log.newData }, null, 2)}
                </pre>
              </div>
            </details>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
