import React, { useState } from 'react';
import { X, Siren, Mail, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { ROLES } from '../../utils/permissions';

export default function ModalReportOccurrence({
  spaces = [],
  preSelectedSpaceId = null,
  currentUser = {},
  collaborators = [],
  onClose,
  onSubmit
}) {
  const supportStaff = collaborators.filter(c => c.systemRole === ROLES.SUPORTE);

  const [selectedSpaceId, setSelectedSpaceId] = useState(preSelectedSpaceId || spaces[0]?.id || '');
  const [failureType, setFailureType] = useState('Necessidade de Limpeza');
  const [priority, setPriority] = useState('Alta');
  const [selectedSupportId, setSelectedSupportId] = useState(supportStaff[0]?.id || '');
  const [manualEmail, setManualEmail] = useState('');
  const [description, setDescription] = useState('');

  const selectedSupport = supportStaff.find(s => s.id === selectedSupportId);
  const targetEmail = supportStaff.length > 0 ? (selectedSupport?.email || '') : manualEmail;

  const handleSubmit = (e) => {
    e.preventDefault();
    const targetSpace = spaces.find(s => s.id === selectedSpaceId);
    onSubmit({
      spaceId: selectedSpaceId,
      spaceName: targetSpace ? targetSpace.name : 'Espaço Desconhecido',
      failureType,
      priority,
      targetEmail,
      description,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  };

  const reporterEmail = currentUser.email || '—';

  return (
    <div className="modal-overlay animate-fade-in">
      <div className="card-reflow" style={{ width: '100%', maxWidth: '520px', padding: '1.75rem', position: 'relative' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 800, fontSize: '1.15rem', color: '#b91c1c' }}>
            <Siren size={22} color="#b91c1c" />
            Reportar Ocorrência & Disparar Gmail
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}>
            <X size={20} />
          </button>
        </div>

        {/* Sender Info Badge */}
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '0.5rem',
          padding: '0.75rem',
          marginBottom: '1rem',
          fontSize: '0.8rem',
          color: '#334155',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Mail size={16} color="#0f2942" />
          <span><strong>Solicitante (você):</strong> {reporterEmail}</span>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
              Local do Problema / Espaço *
            </label>
            <select
              value={selectedSpaceId}
              onChange={(e) => setSelectedSpaceId(e.target.value)}
              style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', fontSize: '0.875rem', backgroundColor: '#ffffff', outline: 'none' }}
            >
              {spaces.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.block})</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                Tipo de Falha
              </label>
              <select
                value={failureType}
                onChange={(e) => setFailureType(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', fontSize: '0.875rem', backgroundColor: '#ffffff', outline: 'none' }}
              >
                <option value="Necessidade de Limpeza">Necessidade de Limpeza</option>
                <option value="Projetor / AV">Projetor / AV</option>
                <option value="Ar-condicionado">Ar-condicionado</option>
                <option value="Elétrica">Elétrica</option>
                <option value="Mobiliário">Mobiliário</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                Prioridade
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', fontSize: '0.875rem', backgroundColor: '#ffffff', outline: 'none' }}
              >
                <option value="Baixa">Baixa</option>
                <option value="Média">Média</option>
                <option value="Alta">Alta (URGENTE)</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
              Equipe de Suporte Responsável *
            </label>
            {supportStaff.length > 0 ? (
              <select
                value={selectedSupportId}
                onChange={(e) => setSelectedSupportId(e.target.value)}
                required
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', fontSize: '0.875rem', backgroundColor: '#ffffff', outline: 'none' }}
              >
                {supportStaff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name && s.name.toLowerCase() !== s.email?.toLowerCase() ? `${s.name} — ${s.email}` : s.email}
                  </option>
                ))}
              </select>
            ) : (
              <>
                <input
                  type="email"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  placeholder="ex: suporte@escola.com"
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', fontSize: '0.875rem', outline: 'none' }}
                  required
                />
                <span style={{ fontSize: '0.7rem', color: '#b45309', marginTop: '0.3rem', display: 'flex', alignItems: 'flex-start', gap: '0.3rem' }}>
                  <AlertCircle size={13} style={{ flexShrink: 0, marginTop: '1px' }} />
                  Nenhuma conta com cargo "Equipe de Suporte" cadastrada ainda. Peça a um Administrador para criar uma em Configurações → Profissionais, ou informe o e-mail manualmente.
                </span>
              </>
            )}
            <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem', display: 'block' }}>
              O e-mail com os detalhes da ocorrência será enviado via API oficial do Gmail para este destinatário.
            </span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
              Descrição do Ocorrido *
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva detalhadamente a necessidade de limpeza ou manutenção..."
              style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', fontSize: '0.875rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 600, fontSize: '0.875rem', padding: '0.6rem 1.2rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{ backgroundColor: '#0b2238', color: '#ffffff', fontWeight: 600, fontSize: '0.875rem', padding: '0.65rem 1.4rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Send size={16} />
              Enviar via Gmail API
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
