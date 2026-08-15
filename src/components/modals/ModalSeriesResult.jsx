import React from 'react';
import { X, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

/**
 * Resumo pós-criação de uma reserva recorrente — mostra quantas ocorrências
 * foram criadas com sucesso e, se houver, quais datas falharam e por quê
 * (ex: choque de horário com uma reserva já existente naquela data). Um
 * toast de 4s não é suficiente pra listar várias datas, então isso reaproveita
 * o mesmo esqueleto .modal-overlay/.card-reflow já usado nos outros modais.
 */
export default function ModalSeriesResult({ succeeded = [], failed = [], className, spaceName, onClose }) {
  const total = succeeded.length + failed.length;
  const allFailed = succeeded.length === 0;

  return (
    <div className="modal-overlay animate-fade-in">
      <div className="card-reflow" style={{ width: '100%', maxWidth: '460px', padding: '1.5rem', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.05rem', color: allFailed ? '#b91c1c' : '#0f2942' }}>
            {allFailed ? <XCircle size={20} color="#b91c1c" /> : <CheckCircle size={20} color="#15803d" />}
            {allFailed ? 'Nenhuma aula pôde ser agendada' : `${succeeded.length} de ${total} aula(s) agendadas`}
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1rem 0' }}>
          Série recorrente de <strong>{className}</strong> em <strong>{spaceName}</strong>.
        </p>

        {failed.length > 0 && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '0.5rem',
            padding: '0.75rem',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 700, color: '#991b1b', marginBottom: '0.5rem' }}>
              <AlertTriangle size={15} />
              Não foi possível agendar:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {failed.map((f, i) => (
                <div key={`${f.date}-${i}`} style={{ fontSize: '0.78rem', color: '#7f1d1d', lineHeight: 1.4 }}>
                  <strong>{f.date}</strong> — {f.reason}
                </div>
              ))}
            </div>
          </div>
        )}

        {succeeded.length > 0 && (
          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '0.5rem',
            padding: '0.75rem',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 700, color: '#166534', marginBottom: '0.5rem' }}>
              <CheckCircle size={15} />
              Agendadas com sucesso:
            </div>
            <div style={{ fontSize: '0.78rem', color: '#166534', lineHeight: 1.5 }}>
              {succeeded.map(a => a.date).join(' · ')}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{ backgroundColor: '#0b2238', color: '#ffffff', fontWeight: 600, fontSize: '0.875rem', padding: '0.6rem 1.4rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer' }}
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
}
