import React from 'react';
import { AlertTriangle, Siren } from 'lucide-react';

export default function FABAlert({ onClick }) {
  return (
    <button
      onClick={onClick}
      title="Reportar Ocorrência / Falha de Infraestrutura"
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        width: '56px',
        height: '56px',
        borderRadius: '9999px',
        backgroundColor: '#b91c1c',
        color: '#ffffff',
        border: 'none',
        boxShadow: '0 4px 14px rgba(185, 28, 28, 0.4)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 90,
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      className="animate-siren"
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      <Siren size={26} />
    </button>
  );
}
