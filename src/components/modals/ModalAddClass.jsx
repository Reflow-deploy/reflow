import React, { useState, useEffect } from 'react';
import { X, BookOpen, Check, Save } from 'lucide-react';

export default function ModalAddClass({ onClose, onSubmit, classToEdit = null }) {
  const [name, setName] = useState(classToEdit?.name || '');
  const [studentsCount, setStudentsCount] = useState(classToEdit?.studentsCount || 30);

  useEffect(() => {
    if (classToEdit) {
      setName(classToEdit.name || '');
      setStudentsCount(classToEdit.studentsCount || 30);
    }
  }, [classToEdit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      id: classToEdit ? classToEdit.id : `turma-${Date.now()}`,
      name: name.trim(),
      studentsCount: Number(studentsCount)
    });
  };

  return (
    <div className="modal-overlay animate-fade-in">
      <div className="card-reflow" style={{ width: '100%', maxWidth: '420px', padding: '1.5rem', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.1rem', color: '#0f2942' }}>
            <BookOpen size={20} color="#0f2942" />
            {classToEdit ? 'Editar Informações da Turma' : 'Adicionar Nova Turma'}
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
              Nome da Turma / Ano *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: 4º Ano - Informática"
              style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', fontSize: '0.875rem', outline: 'none' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
              Quantidade de Alunos *
            </label>
            <input
              type="number"
              min="1"
              max="500"
              value={studentsCount}
              onChange={(e) => setStudentsCount(e.target.value)}
              style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', fontSize: '0.875rem', outline: 'none' }}
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
              style={{ backgroundColor: '#0b2238', color: '#ffffff', fontWeight: 600, fontSize: '0.875rem', padding: '0.6rem 1.4rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              {classToEdit ? <Save size={18} /> : <Check size={18} />}
              {classToEdit ? 'Salvar Alterações' : 'Confirmar Turma'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
