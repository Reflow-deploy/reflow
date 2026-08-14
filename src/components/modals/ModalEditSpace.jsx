import React, { useState } from 'react';
import { X, Save, Building, Users, Check, AlertCircle } from 'lucide-react';

const AVAILABLE_EQUIPMENTS = [
  'Projetor',
  'Ar-condicionado',
  'Lousa Digital',
  'Computadores',
  'Sistema de Som',
  'Microfone',
  'Wi-Fi de Alta Velocidade'
];

const SPACE_TYPES = [
  'Sala de Aula',
  'Laboratório',
  'Auditório',
  'Apoio',
  'Administração',
  'Quadra de Esportes'
];

const BLOCKS = [
  'Bloco A (Principal)',
  'Bloco B (Ciência & Tech)',
  'Área Externa'
];

const DESK_TYPES = [
  { value: 'Grupo', label: '👥 Mesas em Grupo (Bancadas)' },
  { value: 'Individual', label: '🪑 Mesas Individuais' },
  { value: 'Mista', label: '🔄 Layout Misto' }
];

export default function ModalEditSpace({ space, onClose, onSave }) {
  if (!space) return null;

  const [name, setName] = useState(space.name || '');
  const [type, setType] = useState(space.type || 'Sala de Aula');
  const [capacity, setCapacity] = useState(space.capacity || 35);
  const [block, setBlock] = useState(space.block || 'Bloco A (Principal)');
  const [status, setStatus] = useState(space.status || 'LIVRE');
  const [deskType, setDeskType] = useState(space.deskType || 'Individual');
  const [equipments, setEquipments] = useState(space.equipments || ['Projetor', 'Ar-condicionado', 'Lousa Digital']);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleToggleEquipment = (item) => {
    if (equipments.includes(item)) {
      setEquipments(equipments.filter(e => e !== item));
    } else {
      setEquipments([...equipments, item]);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('O nome da sala é obrigatório.');
      return;
    }

    onSave({
      ...space,
      name: name.trim(),
      type,
      capacity: Number(capacity),
      block,
      status,
      deskType,
      equipments
    });

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 600);
  };

  return (
    <div className="modal-overlay animate-fade-in" style={{
      position: 'fixed', inset: 0, zIndex: 200,
      backgroundColor: 'rgba(15,41,56,0.45)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '1.25rem',
        boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
        width: '100%',
        maxWidth: '520px',
        padding: '2rem',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f2942' }}>
              Editar Informações da Sala
            </h2>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              Código do Espaço: <code style={{ backgroundColor: '#f1f5f9', padding: '0.1rem 0.4rem', borderRadius: '0.25rem', color: '#0b2238' }}>{space.id}</code>
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: '#f1f5f9', border: 'none', borderRadius: '0.5rem', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <X size={16} color="#475569" />
          </button>
        </div>

        {errorMsg && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.75rem 1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: '0.5rem', color: '#b91c1c', fontSize: '0.85rem', marginBottom: '1rem'
          }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Nome da Sala */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
              Nome de Exibição da Sala:
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Laboratório de Robótica"
              style={{
                width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.875rem',
                borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: '#ffffff',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Tipo e Capacidade (Grid 2 cols) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                Tipo de Espaço:
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                style={{
                  width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.875rem',
                  borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: '#ffffff'
                }}
              >
                {SPACE_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                Capacidade (Alunos):
              </label>
              <input
                type="number"
                min="1"
                max="500"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                style={{
                  width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.875rem',
                  borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: '#ffffff',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Bloco e Status (Grid 2 cols) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                Bloco do Edifício:
              </label>
              <select
                value={block}
                onChange={(e) => setBlock(e.target.value)}
                style={{
                  width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.875rem',
                  borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: '#ffffff'
                }}
              >
                {BLOCKS.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                Status Operacional:
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.875rem',
                  borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: '#ffffff'
                }}
              >
                <option value="LIVRE">🟢 LIVRE</option>
                <option value="OCUPADO">🔵 OCUPADO</option>
                <option value="MANUTENCAO">🟠 MANUTENÇÃO</option>
              </select>
            </div>
          </div>

          {/* Tipo de Mesas dos Alunos */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
              Disposição das Mesas para Alunos:
            </label>
            <select
              value={deskType}
              onChange={(e) => setDeskType(e.target.value)}
              style={{
                width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.875rem',
                borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: '#ffffff'
              }}
            >
              {DESK_TYPES.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>

          {/* Checklist de Equipamentos / Objetos */}
          <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#0f2942', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Objetos & Equipamentos Presentes:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {AVAILABLE_EQUIPMENTS.map(item => {
                const isChecked = equipments.includes(item);
                return (
                  <label key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem', color: '#334155', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleEquipment(item)}
                      style={{ accentColor: '#0b2238' }}
                    />
                    <span>{item}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: '0.75rem', borderRadius: '0.6rem',
                border: '1px solid #e2e8f0', backgroundColor: '#f8fafc',
                fontSize: '0.875rem', fontWeight: 600, color: '#475569',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                flex: 1, padding: '0.75rem', borderRadius: '0.6rem',
                border: 'none',
                backgroundColor: saved ? '#15803d' : '#0b2238',
                fontSize: '0.875rem', fontWeight: 700, color: '#ffffff',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                transition: 'background 0.25s'
              }}
            >
              {saved ? <><Check size={16} /> Salvo no Banco!</> : <><Save size={16} /> Salvar Alterações</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
