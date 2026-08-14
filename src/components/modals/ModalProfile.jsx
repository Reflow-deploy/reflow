import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Upload, ShieldCheck, UserCheck, Wrench, Lock, Check, Loader2 } from 'lucide-react';
import { dbGetMyCollaboratorRecord } from '../../services/supabaseService';

const ROLE_ICONS = {
  'Administrador': ShieldCheck,
  'Direção': ShieldCheck,
  'Professor': UserCheck,
  'Equipe de Suporte': Wrench
};

const ROLE_DESCRIPTIONS = {
  'Administrador': 'Acesso total ao sistema',
  'Direção': 'Acesso total ao sistema',
  'Professor': 'Aloca espaços e reporta ocorrências',
  'Equipe de Suporte': 'Equipe técnica responsável por resolver falhas de infraestrutura'
};

export default function ModalProfile({ currentUser, onClose, onSave }) {
  const [previewUrl, setPreviewUrl] = useState(currentUser?.avatar || null);
  const [isDragging, setIsDragging] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef(null);

  // Cargo em tempo real, direto do banco (collaborators.system_role) — não
  // depende do claim do JWT, que só é atualizado no próximo login/refresh.
  const [liveRole, setLiveRole] = useState(null);
  const [loadingRole, setLoadingRole] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoadingRole(true);
    dbGetMyCollaboratorRecord(currentUser?.id).then(record => {
      if (cancelled) return;
      setLiveRole(record?.systemRole || null);
      setLoadingRole(false);
    });
    return () => { cancelled = true; };
  }, [currentUser?.id]);

  // Enquanto a busca no banco não termina, mostra o cargo que já veio da
  // sessão (evita a tela "piscar" vazia) — assim que a busca responde, o
  // valor real do banco assume.
  const displayedRole = liveRole || currentUser?.role;
  const RoleIcon = ROLE_ICONS[displayedRole] || ShieldCheck;

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e) => handleFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSave = () => {
    onSave({
      ...currentUser,
      avatar: previewUrl
    });
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 900);
  };

  const initials = (currentUser?.name || 'U').split(' ').slice(0, 2).map(n => n[0]).join('');

  return (
    /* Overlay */
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        backgroundColor: 'rgba(15,41,56,0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 0.18s ease'
      }}
    >
      {/* Modal Card */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '1.25rem',
          boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
          width: '100%', maxWidth: '440px',
          padding: '2rem',
          animation: 'slideUp 0.22s ease'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f1f2e' }}>Meu Perfil</h2>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              Gerencie seus dados e nível de acesso no sistema
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: '#f1f5f9', border: 'none', borderRadius: '0.5rem', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <X size={16} color="#475569" />
          </button>
        </div>

        {/* Avatar Area */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              width: '88px', height: '88px', borderRadius: '9999px',
              backgroundColor: '#e0f2fe', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '3px solid #0b2238', boxShadow: '0 4px 16px rgba(11,34,56,0.15)'
            }}>
              {previewUrl
                ? <img src={previewUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0369a1' }}>{initials}</span>
              }
            </div>
            <button
              onClick={() => fileInputRef.current.click()}
              style={{
                position: 'absolute', bottom: 0, right: 0,
                width: '28px', height: '28px', borderRadius: '9999px',
                backgroundColor: '#0b2238', border: '2px solid #fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}
            >
              <Camera size={12} color="#ffffff" />
            </button>
          </div>

          <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
            {currentUser?.name}
          </p>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
            {currentUser?.email}
          </p>
        </div>

        {/* Cargo (somente leitura — definido por um Administrador no backend) */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem' }}>
            Cargo / Tipo de Conta (Permissões):
          </label>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.625rem 0.75rem',
            borderRadius: '0.5rem',
            fontSize: '0.825rem',
            fontWeight: 600,
            border: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            color: '#0f2942'
          }}>
            <RoleIcon size={16} color="#0f2942" style={{ flexShrink: 0 }} />
            <span style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', flex: 1 }}>
              <span>{displayedRole}</span>
              <span style={{ fontSize: '0.7rem', fontWeight: 500, color: '#94a3b8' }}>
                {ROLE_DESCRIPTIONS[displayedRole] || 'Cargo atribuído pela escola'}
              </span>
            </span>
            {loadingRole && <Loader2 size={14} color="#94a3b8" className="animate-spin" style={{ flexShrink: 0 }} />}
            <Lock size={14} color="#94a3b8" style={{ flexShrink: 0 }} />
          </div>
          <p style={{ margin: '0.4rem 0 0', fontSize: '0.7rem', color: '#94a3b8' }}>
            Cargo definido por um Administrador. Fale com a coordenação para alterá-lo.
          </p>
        </div>

        {/* Upload Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
          style={{
            border: `2px dashed ${isDragging ? '#0b2238' : '#cbd5e1'}`,
            borderRadius: '0.75rem',
            backgroundColor: isDragging ? '#f0f6ff' : '#f8fafc',
            padding: '1rem',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            marginBottom: '1.25rem'
          }}
        >
          <div style={{
            width: '32px', height: '32px', borderRadius: '0.5rem',
            backgroundColor: isDragging ? '#dbeafe' : '#e2e8f0',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Upload size={16} color={isDragging ? '#0b2238' : '#64748b'} />
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
            Clique ou arraste uma foto
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          style={{ display: 'none' }}
        />

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '0.65rem', borderRadius: '0.6rem',
              border: '1px solid #e2e8f0', backgroundColor: '#f8fafc',
              fontSize: '0.85rem', fontWeight: 600, color: '#475569',
              cursor: 'pointer'
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 1, padding: '0.65rem', borderRadius: '0.6rem',
              border: 'none',
              backgroundColor: saved ? '#15803d' : '#0b2238',
              fontSize: '0.85rem', fontWeight: 600, color: '#ffffff',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
              transition: 'background 0.25s'
            }}
          >
            {saved ? <><Check size={15} /> Salvo!</> : 'Salvar Alterações'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>
    </div>
  );
}
