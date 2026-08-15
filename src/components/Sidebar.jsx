import React, { useState } from 'react';
import { Map, Calendar, AlertTriangle, BarChart3, Settings, LogOut, ChevronDown } from 'lucide-react';
import ModalProfile from './modals/ModalProfile';
import { getAllowedTabs } from '../utils/permissions';
import { useIsMobile } from '../utils/useIsMobile';

export default function Sidebar({ activeTab, setActiveTab, spacesCount, occupiedCount, occurrencesCount = 0, onLogout, currentUser, onUpdateUser, isOpen = false, onClose = () => {} }) {
  const isMobile = useIsMobile();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const freeCount = spacesCount - occupiedCount;

  const allowedTabs = getAllowedTabs(currentUser?.role);
  const navItems = [
    { id: 'map', label: 'Mapa Interativo', icon: Map },
    { id: 'occurrences', label: 'Ocorrências', icon: AlertTriangle, badgeCount: occurrencesCount },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ].filter(item => allowedTabs.includes(item.id));

  return (
    <>
    {isMobile && isOpen && (
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 49 }}
      />
    )}
    <aside style={{
      width: '260px',
      height: '100vh',
      backgroundColor: '#ffffff',
      borderRight: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.75rem 1.25rem 2rem 1.25rem',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 50,
      transform: isMobile ? (isOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
      transition: 'transform 0.25s ease',
      boxShadow: isMobile && isOpen ? '4px 0 16px rgba(0,0,0,0.15)' : 'none'
    }}>
      <div>
        {/* Brand Logo Header */}
        <div style={{ padding: '0 0.25rem 2rem 0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img 
            src="/logo.webp" 
            alt="Reflow Logo" 
            style={{ height: '52px', maxWidth: '200px', objectFit: 'contain' }} 
          />
        </div>

        {/* Navigation Menu Links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); if (isMobile) onClose(); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  fontSize: '0.925rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#ffffff' : '#475569',
                  backgroundColor: isActive ? '#0b2238' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                  width: '100%',
                  position: 'relative'
                }}
              >
                <Icon size={18} color={isActive ? '#ffffff' : '#64748b'} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {Boolean(item.badgeCount && item.badgeCount > 0) && (
                  <span style={{
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    minWidth: '18px',
                    height: '18px',
                    padding: '0 0.3rem',
                    borderRadius: '9999px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {item.badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Logout & General Occupation Widget (Empurrado totalmente para baixo) */}
      <div style={{ marginTop: 'auto', paddingTop: '1.5rem' }}>
        <button
          onClick={onLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'none',
            border: 'none',
            color: '#b91c1c',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
            padding: '0.5rem 0.25rem',
            marginBottom: '1.25rem',
            transition: 'opacity 0.2s ease'
          }}
        >
          <LogOut size={16} />
          Sair da Conta
        </button>

        {/* OCUPAÇÃO GERAL Widget */}
        <div style={{
          borderTop: '1px solid #e2e8f0',
          paddingTop: '1rem'
        }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            OCUPAÇÃO GERAL
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#475569', marginBottom: '0.35rem' }}>
            <span>Salas Livres</span>
            <span style={{ fontWeight: 700, color: '#15803d' }}>{freeCount} / {spacesCount}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#475569' }}>
            <span>Salas Ocupadas</span>
            <span style={{ fontWeight: 700, color: '#b91c1c' }}>{occupiedCount} / {spacesCount}</span>
          </div>
        </div>

        {/* User Badge */}
        <div style={{ marginTop: '1.25rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem', position: 'relative' }}>
          <div
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              cursor: 'pointer',
              padding: '0.5rem 0.4rem',
              borderRadius: '0.5rem',
              transition: 'background-color 0.2s'
            }}
          >
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '9999px',
              backgroundColor: '#e0f2fe',
              color: '#0369a1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.8rem',
              flexShrink: 0,
              overflow: 'hidden'
            }}>
              {currentUser?.avatar
                ? <img src={currentUser.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (currentUser?.name || 'Filipe Guimarães').split(' ').slice(0,2).map(n => n[0]).join('')
              }
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentUser?.name || 'Prof. Filipe Guimarães'}
            </span>
            <ChevronDown size={14} color="#64748b" />
          </div>

          {showUserMenu && (
            <div style={{
              position: 'absolute',
              bottom: '52px',
              left: 0,
              right: 0,
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              padding: '0.5rem',
              zIndex: 60
            }}>
              <div style={{ padding: '0.4rem 0.5rem', fontSize: '0.72rem', color: '#64748b', borderBottom: '1px solid #f1f5f9', marginBottom: '0.25rem' }}>
                {currentUser?.role || 'Professor Responsável'}
              </div>
              <button
                onClick={() => { setShowUserMenu(false); setShowProfileModal(true); }}
                style={{ width: '100%', textAlign: 'left', padding: '0.5rem', border: 'none', background: 'none', fontSize: '0.82rem', color: '#334155', cursor: 'pointer', borderRadius: '0.25rem' }}
              >
                Meu Perfil
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>

    {showProfileModal && (
      <ModalProfile
        currentUser={currentUser}
        onClose={() => setShowProfileModal(false)}
        onSave={(updatedUser) => {
          if (onUpdateUser) onUpdateUser(updatedUser);
          setShowProfileModal(false);
        }}
      />
    )}
    </>
  );
}
