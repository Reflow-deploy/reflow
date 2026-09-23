import React from 'react';
import { AlertTriangle, Siren } from 'lucide-react';
import { useIsMobile } from '../utils/useIsMobile';

export default function FABAlert({ onClick }) {
  const isMobile = useIsMobile();
  // Em mobile: menor e mais colado no canto (e acima da área segura do
  // iPhone), pra cobrir menos do mapa e das listas por trás dele.
  const size = isMobile ? 46 : 56;
  const offsetBottom = isMobile ? 'calc(1rem + env(safe-area-inset-bottom))' : '2rem';
  const offsetRight = isMobile ? '1rem' : '2rem';

  return (
    <button
      onClick={onClick}
      title="Reportar Ocorrência / Falha de Infraestrutura"
      aria-label="Reportar ocorrência ou falha de infraestrutura"
      style={{
        position: 'fixed',
        bottom: offsetBottom,
        right: offsetRight,
        width: `${size}px`,
        height: `${size}px`,
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
      <Siren size={isMobile ? 22 : 26} />
    </button>
  );
}
