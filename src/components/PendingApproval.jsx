import React from 'react';
import { Hourglass, LogOut } from 'lucide-react';

/**
 * Tela exibida para contas com cargo "Pendente" — todo novo login (via
 * Google) recebe esse cargo automaticamente até um Administrador aprovar
 * e definir o cargo real diretamente na tabela `user_roles` do Supabase.
 */
export default function PendingApproval({ userEmail, onLogout }) {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f4f4f5',
      padding: '1.5rem',
      boxSizing: 'border-box'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e4e4e7',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.04), 0 4px 6px -4px rgba(0, 0, 0, 0.02)',
        padding: '2.5rem 2rem',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center'
      }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '9999px',
          backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '1.25rem'
        }}>
          <Hourglass size={26} color="#92400e" />
        </div>

        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#18181b', margin: 0 }}>
          Aguardando Aprovação
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#71717a', margin: '0.75rem 0 0 0', lineHeight: 1.5 }}>
          Sua conta foi criada, mas ainda não tem um cargo liberado no sistema Reflow.
          Peça a um Administrador para aprovar o acesso do e-mail abaixo.
        </p>

        <div style={{
          marginTop: '1.25rem', width: '100%', padding: '0.65rem 1rem',
          backgroundColor: '#f4f4f5', borderRadius: '8px',
          fontSize: '0.875rem', fontWeight: 600, color: '#18181b', wordBreak: 'break-all'
        }}>
          {userEmail}
        </div>

        <button
          onClick={onLogout}
          style={{
            marginTop: '1.75rem',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'none', border: 'none', color: '#b91c1c',
            fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', padding: '0.4rem'
          }}
        >
          <LogOut size={15} />
          Sair da Conta
        </button>
      </div>
    </div>
  );
}
