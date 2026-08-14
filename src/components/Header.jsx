import React from 'react';
import { Search } from 'lucide-react';

export default function Header({ searchQuery, setSearchQuery, onSearchSubmit, showSearch = true }) {

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
      padding: '0 2rem',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      marginLeft: '260px'
    }}>
      {/* Global Search Bar - Visível apenas na aba Mapa Interativo */}
      {showSearch ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, maxWidth: '520px' }}>
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

