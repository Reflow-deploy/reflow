import React, { useState } from 'react';
import { X, UserPlus, Check, Edit3 } from 'lucide-react';
import { useIsMobile } from '../../utils/useIsMobile';

export default function ModalAddCollaborator({ onClose, onSubmit, initialData = null }) {
  const isEditing = !!initialData;
  const isMobile = useIsMobile();

  // Campos: minWidth:0 pra não vazarem da coluna do grid. A fonte de 16px em
  // telas estreitas vem de index.css (evita o zoom do iPhone ao focar).
  const inputStyle = {
    width: '100%', boxSizing: 'border-box', minWidth: 0,
    padding: '0.6rem 0.8rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0',
    fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit'
  };
  const twoCols = isMobile ? '1fr' : 'minmax(0, 1fr) minmax(0, 1fr)';
  // No iPhone, <input type="time"> e <select> ganham um visual cinza nativo e o
  // horário ignora a largura da coluna (vazava do cartão). appearance:none +
  // fundo branco deixa iguais aos outros campos; o select ganha uma seta própria.
  const timeStyle = {
    ...inputStyle, display: 'block', WebkitAppearance: 'none', appearance: 'none',
    textAlign: 'left', minHeight: '2.75rem', backgroundColor: '#ffffff'
  };
  const selectStyle = {
    ...inputStyle, WebkitAppearance: 'none', appearance: 'none', minHeight: '2.75rem',
    backgroundColor: '#ffffff', paddingRight: '2.2rem', backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 0.7rem center', backgroundSize: '1rem',
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")"
  };

  const [name, setName]               = useState(initialData?.name       || '');
  const [category, setCategory]       = useState(initialData?.category   || 'Docente');
  const [role, setRole]               = useState(initialData?.role       || '');
  const [email, setEmail]             = useState(initialData?.email      || '');
  const [phone, setPhone]             = useState(initialData?.phone      || '');
  const [startTime, setStartTime]     = useState(initialData?.startTime  || '07:30');
  const [endTime, setEndTime]         = useState(initialData?.endTime    || '12:20');
  const [selectedDays, setSelectedDays] = useState(initialData?.workDays || ['Seg', 'Ter', 'Qua', 'Qui', 'Sex']);
  const [notes, setNotes]             = useState(initialData?.notes      || '');

  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !role || !email) return;

    const names = name.trim().split(' ');
    const initials = (names[0][0] + (names[1] ? names[1][0] : '')).toUpperCase();

    onSubmit({
      id: initialData?.id || `col-${Date.now()}`,
      initials,
      name,
      status: initialData?.status || 'PRESENTE',
      category,
      role,
      email,
      phone: phone || '(11) 99999-0000',
      startTime,
      endTime,
      workDays: selectedDays,
      notes
    });
  };

  return (
    <div className="modal-overlay animate-fade-in">
      <div className="card-reflow" style={{ width: '100%', maxWidth: '520px', padding: 0, position: 'relative', display: 'flex', flexDirection: 'column', maxHeight: '92dvh', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, padding: isMobile ? '1rem 1.1rem 0.8rem' : '1.25rem 1.5rem 0.9rem', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.1rem', color: '#0f2942' }}>
            {isEditing ? <Edit3 size={20} color="#0f2942" /> : <UserPlus size={20} color="#0f2942" />}
            {isEditing ? 'Editar colaborador' : 'Novo colaborador'}
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', display: 'flex', flexDirection: 'column', gap: isMobile ? '0.85rem' : '1rem', padding: isMobile ? '0.9rem 1.1rem' : '1rem 1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
              Nome completo *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Profa. Regina Vasconcellos"
              style={inputStyle}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: twoCols, gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={selectStyle}
              >
                <option value="Docente">Docente</option>
                <option value="Limpeza/Apoio">Limpeza / Apoio</option>
                <option value="Direção">Direção</option>
                <option value="Suporte">Suporte técnico</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                Função *
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Ex: Professora de Química"
                style={inputStyle}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: twoCols, gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                E-mail *
              </label>
              <input
                type="email"
                inputMode="email"
                autoCapitalize="none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@reflow.edu.br"
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                Telefone
              </label>
              <input
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 98765-4321"
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                Entrada
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                style={timeStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                Saída
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                style={timeStyle}
              />
            </div>
          </div>

          {/* Days Toggle Pills */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
              Dias de trabalho
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['Seg', 'Ter', 'Qua', 'Qui', 'Sex'].map((day) => {
                const isSelected = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      minHeight: '2.6rem',
                      borderRadius: '0.375rem',
                      border: 'none',
                      backgroundColor: isSelected ? '#15803d' : '#e2e8f0',
                      color: isSelected ? '#ffffff' : '#475569',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
              Observações
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Opcional"
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          </div>

          {/* Action Footer — fixo, sempre visível (só o miolo acima rola) */}
          <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', padding: isMobile ? '0.75rem 1.1rem calc(0.75rem + env(safe-area-inset-bottom))' : '0.9rem 1.5rem', borderTop: '1px solid #f1f5f9', backgroundColor: '#ffffff' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 600, fontSize: '0.875rem', padding: '0.6rem 1.2rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', flex: isMobile ? 1 : 'none', minHeight: '2.6rem' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{ backgroundColor: isEditing ? '#0b2238' : '#15803d', color: '#ffffff', fontWeight: 600, fontSize: '0.875rem', padding: '0.6rem 1.4rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', flex: isMobile ? 1 : 'none', minHeight: '2.6rem' }}
            >
              <Check size={18} />
              {isEditing ? 'Salvar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
