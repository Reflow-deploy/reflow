import React from 'react';
import { Search, Menu } from 'lucide-react';
import { useIsMobile } from '../utils/useIsMobile';

export default function Header({ searchQuery, setSearchQuery, onSearchSubmit, showSearch = true, isSidebarOpen, onToggleSidebar = () => {} }) {
  const isMobile = useIsMobile();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearchSubmit) onSearchSubmit(searchQuery);
  };

  return (
    <header style={{
      height: '70px',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: isMobile ? '0 1rem' : '0 2rem',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      marginLeft: isMobile ? 0 : '260px'
    }}>
      {/* Botão hambúrguer — abre/fecha o drawer da Sidebar em mobile */}
      {isMobile && (
        <button
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? 'Fechar menu' : 'Abrir menu'}
          style={{
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: '#0f2942',
            padding: '0.4rem',
            display: 'flex',
            flexShrink: 0
          }}
        >
          <Menu size={22} />
        </button>
      )}

      {/* Global Search Bar - Visível apenas na aba Mapa Interativo */}
      {showSearch ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, maxWidth: isMobile ? 'none' : '520px' }}>
          <div style={{
            position: 'relative',
            width: '100%',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '1rem' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por sala, professor, equipamentos (projetor), mesas ou capacidade..."
              style={{
                width: '100%',
                padding: '0.6rem 1rem 0.6rem 2.6rem',
                borderRadius: '9999px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                fontSize: '0.875rem',
                color: '#1e293b',
                outline: 'none',
                transition: 'all 0.2s ease'
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              backgroundColor: '#0b2238',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.875rem',
              padding: '0.6rem 1.4rem',
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease'
            }}
          >
            Buscar
          </button>
        </form>
      ) : (
        <div style={{ flex: 1 }} />
      )}
    </header>
  );
}
