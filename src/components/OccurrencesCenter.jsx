import React, { useState } from 'react';
import { AlertTriangle, Mail, Trash2, CheckCircle2, Clock, ShieldAlert, Send, RefreshCw, RotateCcw, X, ChevronLeft } from 'lucide-react';
import { ROLES } from '../utils/permissions';
import { useIsMobile } from '../utils/useIsMobile';

export default function OccurrencesCenter({
  occurrences = [],
  auditLogs = [],
  currentUser = {},
  onUpdateOccurrenceStatus = () => {},
  onClearHistory = () => {},
  onDeleteOccurrence = () => {},
  onResendEmail = () => {}
}) {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('LIST'); // LIST | AUDIT
  const [filterDept, setFilterDept] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ABERTO'); // ABERTO | RESOLVIDO | ALL
  const [selectedAuditLog, setSelectedAuditLog] = useState(null);

  // Só a Equipe de Suporte pode limpar o histórico inteiro; qualquer outro
  // cargo só apaga a própria solicitação (verificado de novo no banco via RLS).
  const canClearAll = currentUser?.role === ROLES.SUPORTE;

  // Deriva o log selecionado atual ou o primeiro da lista
  const activeLog = selectedAuditLog || (auditLogs.length > 0 ? auditLogs[0] : null);

  const openCount = occurrences.filter(o => (o.status || 'ABERTO') !== 'RESOLVIDO').length;
  const resolvedCount = occurrences.filter(o => o.status === 'RESOLVIDO').length;

  const filteredOccurrences = occurrences.filter(occ => {
    const status = occ.status || 'ABERTO';
    if (filterStatus !== 'ALL' && status !== filterStatus) return false;
    if (filterDept === 'ALL') return true;
    if (filterDept === 'LIMPEZA') return occ.failureType === 'Necessidade de Limpeza';
    if (filterDept === 'TI') return occ.failureType === 'Projetor / AV';
    if (filterDept === 'MANUTENCAO') return ['Ar-condicionado', 'Elétrica', 'Mobiliário'].includes(occ.failureType);
    return true;
  });

  return (
    <div style={{ padding: '1.5rem 2rem', flex: 1, overflowY: 'auto' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f2942' }}>
              Ocorrências e Suporte Técnico
            </h1>
            <span style={{
              backgroundColor: '#dcfce7',
              color: '#15803d',
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}>
              <CheckCircle2 size={12} />
              Envio de e-mail automático
            </span>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
            Acompanhe problemas nos espaços e audite os e-mails automáticos disparados via API oficial do Gmail
          </p>
        </div>

        {/* Navigation Tabs & Clear Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '0.25rem', borderRadius: '0.5rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxWidth: '100%' }}>
            <button
              onClick={() => setActiveTab('LIST')}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '0.375rem',
                border: 'none',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: activeTab === 'LIST' ? '#0b2238' : 'transparent',
                color: activeTab === 'LIST' ? '#ffffff' : '#64748b',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              Lista de Ocorrências ({occurrences.length})
            </button>
            <button
              onClick={() => setActiveTab('AUDIT')}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '0.375rem',
                border: 'none',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: activeTab === 'AUDIT' ? '#0b2238' : 'transparent',
                color: activeTab === 'AUDIT' ? '#ffffff' : '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              Auditoria de E-mails
              {auditLogs.length > 0 && (
                <span style={{
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '0.1rem 0.4rem',
                  borderRadius: '9999px'
                }}>
                  {auditLogs.length}
                </span>
              )}
            </button>
          </div>

          {canClearAll && (
            <button
              onClick={() => {
                setSelectedAuditLog(null);
                onClearHistory();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.9rem',
                borderRadius: '0.5rem',
                border: '1px solid #fee2e2',
                backgroundColor: '#fff5f5',
                color: '#b91c1c',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Trash2 size={14} />
              Limpar Histórico
            </button>
          )}
        </div>
      </div>

      {/* VIEW: Occurrences List */}
      {activeTab === 'LIST' && (
        <div className="card-reflow" style={{ padding: '1.5rem' }}>
          {/* Status Filter Bar (ABERTO / RESOLVIDO) */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setFilterStatus('ABERTO')}
              style={{
                padding: '0.35rem 0.8rem',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: filterStatus === 'ABERTO' ? '1px solid #b91c1c' : '1px solid #e2e8f0',
                backgroundColor: filterStatus === 'ABERTO' ? '#fee2e2' : '#ffffff',
                color: filterStatus === 'ABERTO' ? '#991b1b' : '#64748b'
              }}
            >
              Abertos ({openCount})
            </button>
            <button
              onClick={() => setFilterStatus('RESOLVIDO')}
              style={{
                padding: '0.35rem 0.8rem',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: filterStatus === 'RESOLVIDO' ? '1px solid #15803d' : '1px solid #e2e8f0',
                backgroundColor: filterStatus === 'RESOLVIDO' ? '#dcfce7' : '#ffffff',
                color: filterStatus === 'RESOLVIDO' ? '#166534' : '#64748b'
              }}
            >
              Resolvidos ({resolvedCount})
            </button>
            <button
              onClick={() => setFilterStatus('ALL')}
              style={{
                padding: '0.35rem 0.8rem',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: filterStatus === 'ALL' ? '1px solid #0f2942' : '1px solid #e2e8f0',
                backgroundColor: filterStatus === 'ALL' ? '#0f2942' : '#ffffff',
                color: filterStatus === 'ALL' ? '#ffffff' : '#64748b'
              }}
            >
              Todos os Status ({occurrences.length})
            </button>
          </div>

          {/* Department Filter Bar */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setFilterDept('ALL')}
              style={{
                padding: '0.35rem 0.8rem',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: filterDept === 'ALL' ? '1px solid #0f2942' : '1px solid #e2e8f0',
                backgroundColor: filterDept === 'ALL' ? '#0f2942' : '#ffffff',
                color: filterDept === 'ALL' ? '#ffffff' : '#64748b'
              }}
            >
              Todas as Falhas ({occurrences.length})
            </button>
            <button
              onClick={() => setFilterDept('LIMPEZA')}
              style={{
                padding: '0.35rem 0.8rem',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: filterDept === 'LIMPEZA' ? '1px solid #0f2942' : '1px solid #e2e8f0',
                backgroundColor: filterDept === 'LIMPEZA' ? '#0f2942' : '#ffffff',
                color: filterDept === 'LIMPEZA' ? '#ffffff' : '#64748b'
              }}
            >
              Equipe de Limpeza & Apoio
            </button>
            <button
              onClick={() => setFilterDept('TI')}
              style={{
                padding: '0.35rem 0.8rem',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: filterDept === 'TI' ? '1px solid #0f2942' : '1px solid #e2e8f0',
                backgroundColor: filterDept === 'TI' ? '#0f2942' : '#ffffff',
                color: filterDept === 'TI' ? '#ffffff' : '#64748b'
              }}
            >
              Suporte de TI & AV
            </button>
            <button
              onClick={() => setFilterDept('MANUTENCAO')}
              style={{
                padding: '0.35rem 0.8rem',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: filterDept === 'MANUTENCAO' ? '1px solid #0f2942' : '1px solid #e2e8f0',
                backgroundColor: filterDept === 'MANUTENCAO' ? '#0f2942' : '#ffffff',
                color: filterDept === 'MANUTENCAO' ? '#ffffff' : '#64748b'
              }}
            >
              Manutenção Predial / Elétrica
            </button>
          </div>

          {filteredOccurrences.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#94a3b8' }}>
              <CheckCircle2 size={52} color="#22c55e" style={{ margin: '0 auto 1rem auto' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#334155' }}>Tudo Limpo!</h3>
              <p style={{ fontSize: '0.875rem' }}>Nenhuma ocorrência {filterStatus === 'RESOLVIDO' ? 'resolvida' : filterStatus === 'ABERTO' ? 'aberta' : ''} nesta categoria no momento.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredOccurrences.map((occ) => {
                const isUrgent = occ.priority === 'Alta';
                const status = occ.status || 'ABERTO';
                const isResolved = status === 'RESOLVIDO';
                const isOwnRequest = Boolean(currentUser?.id) && occ.reportedByUserId === currentUser.id;
                return (
                  <div key={occ.id} style={{
                    backgroundColor: isResolved ? '#f8fafc' : '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderLeft: `5px solid ${isResolved ? '#15803d' : (isUrgent ? '#ef4444' : '#f59e0b')}`,
                    borderRadius: '0.5rem',
                    padding: '1.25rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2942' }}>
                          {occ.spaceName}
                        </span>
                        <span style={{
                          backgroundColor: isUrgent ? '#fee2e2' : '#fef3c7',
                          color: isUrgent ? '#991b1b' : '#92400e',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '0.25rem',
                          textTransform: 'uppercase'
                        }}>
                          Prioridade: {occ.priority}
                        </span>
                        <span style={{
                          backgroundColor: isResolved ? '#dcfce7' : '#e0f2fe',
                          color: isResolved ? '#166534' : '#0369a1',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '0.25rem',
                          textTransform: 'uppercase'
                        }}>
                          {status}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          🕒 {occ.createdAt}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                        Categorização: {occ.failureType}
                      </div>

                      <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.75rem' }}>
                        "{occ.description}"
                      </p>

                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
                        <span>Solicitante: {occ.reportedBy}</span>
                        <span>Destino (Gmail): <strong>{occ.targetEmail || occ.targetDepartment}</strong></span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'stretch' }}>
                      <button
                        onClick={() => onUpdateOccurrenceStatus(occ.id, isResolved ? 'ABERTO' : 'RESOLVIDO')}
                        style={{
                          backgroundColor: isResolved ? '#ffffff' : '#15803d',
                          color: isResolved ? '#334155' : '#ffffff',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          padding: '0.5rem 0.9rem',
                          borderRadius: '0.375rem',
                          border: isResolved ? '1px solid #e2e8f0' : 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {isResolved ? <RotateCcw size={15} /> : <CheckCircle2 size={15} />}
                        {isResolved ? 'Reabrir Chamado' : 'Marcar como Resolvido'}
                      </button>

                      {isOwnRequest && (
                        <button
                          onClick={() => onDeleteOccurrence(occ.id)}
                          title="Excluir minha solicitação"
                          style={{
                            backgroundColor: '#ffffff',
                            color: '#b91c1c',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            padding: '0.4rem 0.9rem',
                            borderRadius: '0.375rem',
                            border: '1px solid #fecaca',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.35rem',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <X size={13} />
                          Excluir Minha Solicitação
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW: E-mail Audit Log (Gmail API Logs) */}
      {activeTab === 'AUDIT' && (
        <div className="card-reflow" style={{ padding: '1.5rem', minHeight: '480px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '340px 1fr', gap: '1.5rem' }}>

            {/* Sent Mail List — em mobile, some assim que um item é selecionado
                (mostra só o detalhe + botão Voltar) */}
            {(!isMobile || !selectedAuditLog) && (
            <div style={{ borderRight: isMobile ? 'none' : '1px solid #f1f5f9', paddingRight: isMobile ? 0 : '1rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                Mensagens Disparadas via API Gmail ({auditLogs.length})
              </div>

              {auditLogs.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Nenhum e-mail disparado via API ainda.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {auditLogs.map((log) => {
                    const isSelected = activeLog?.id === log.id;
                    return (
                      <div
                        key={log.id}
                        onClick={() => setSelectedAuditLog(log)}
                        style={{
                          padding: '0.75rem',
                          borderRadius: '0.5rem',
                          border: `1px solid ${isSelected ? '#0b2238' : '#e2e8f0'}`,
                          backgroundColor: isSelected ? '#f8fafc' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.2rem' }}>
                          <span>Para: {log.to}</span>
                          <span>🕒 {log.timestamp}</span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#0f2942', marginBottom: '0.25rem' }}>
                          {log.subject}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{
                            backgroundColor: '#fee2e2',
                            color: '#991b1b',
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            padding: '0.1rem 0.35rem',
                            borderRadius: '0.2rem'
                          }}>
                            {log.priorityBadge}
                          </span>
                          {log.deliveryFailed ? (
                            <span style={{
                              backgroundColor: '#fef2f2',
                              color: '#b91c1c',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              padding: '0.1rem 0.35rem',
                              borderRadius: '0.2rem'
                            }}>
                              FALHA NO ENVIO
                            </span>
                          ) : log.gmailMessageId && (
                            <span style={{
                              backgroundColor: '#dcfce7',
                              color: '#15803d',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              padding: '0.1rem 0.35rem',
                              borderRadius: '0.2rem'
                            }}>
                              GMAIL ID: {log.gmailMessageId.substring(0, 8)}...
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            )}

            {/* Email Inspector Detail View — em mobile, só aparece após
                selecionar um item da lista */}
            {(!isMobile || selectedAuditLog) && (
            <div>
              {isMobile && selectedAuditLog && (
                <button
                  onClick={() => setSelectedAuditLog(null)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                    border: 'none', background: 'none', color: '#0369a1',
                    fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
                    marginBottom: '0.75rem', padding: 0
                  }}
                >
                  <ChevronLeft size={16} /> Voltar para a lista
                </button>
              )}
              {activeLog ? (
                <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '1.25rem' }}>
                  <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f2942', marginBottom: '0.35rem' }}>
                        {activeLog.subject}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <div><strong>Destinatário (Gmail):</strong> {activeLog.to}</div>
                        <div><strong>Horário do Disparo:</strong> {activeLog.timestamp}</div>
                        {activeLog.gmailMessageId && (
                          <div style={{ color: '#166534', fontWeight: 600 }}>
                            <strong>Gmail Message ID:</strong> {activeLog.gmailMessageId} (Status: HTTP 200 OK)
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => onResendEmail(activeLog)}
                      style={{
                        backgroundColor: '#0f2942',
                        color: '#ffffff',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '0.4rem 0.8rem',
                        borderRadius: '0.375rem',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <RefreshCw size={13} />
                      Reenviar Alerta
                    </button>
                  </div>

                  <pre style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.825rem',
                    color: '#334155',
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.6',
                    backgroundColor: '#ffffff',
                    padding: '1rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #e2e8f0'
                  }}>
                    {activeLog.fullBody}
                  </pre>
                </div>
              ) : (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                  <Mail size={40} style={{ marginBottom: '0.5rem' }} />
                  <p style={{ fontSize: '0.875rem' }}>Nenhum Alerta Selecionado</p>
                </div>
              )}
            </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
