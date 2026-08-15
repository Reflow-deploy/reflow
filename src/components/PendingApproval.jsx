import React, { useState } from 'react';
import { Hourglass, LogOut, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getRoleFromSession } from '../utils/jwt';
import { ROLES } from '../utils/permissions';

/**
 * Tela exibida para contas com cargo "Pendente" — todo novo login (via
 * Google) recebe esse cargo automaticamente até um Administrador aprovar
 * e definir o cargo real diretamente na tabela `collaborators` do Supabase.
 *
 * O cargo é lido de um claim customizado (`user_role`) dentro do JWT,
 * injetado pelo Custom Access Token Hook a cada emissão de token. Por isso
 * "Verificar novamente" chama refreshSession() para forçar um novo token —
 * se o cargo mudou, o onAuthStateChange já registrado em App.jsx reconstrói
 * currentUser sozinho e troca de tela automaticamente.
 */
export default function PendingApproval({ userEmail, onLogout }) {
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'info' | 'error', text }

  const handleCheckAgain = async () => {
    if (checking || !supabase) return;
    setChecking(true);
    setFeedback(null);
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;

      const newRole = getRoleFromSession(data?.session);
      if (newRole && newRole !== ROLES.PENDENTE) {
        // Sucesso: o onAuthStateChange do App.jsx já reconstrói currentUser
        // a partir da nova sessão e troca de tela sozinho — este componente
        // será desmontado, não precisamos navegar manualmente.
        return;
      }
      setFeedback({ type: 'info', text: 'Ainda aguardando aprovação. Tente novamente em instantes.' });
    } catch (err) {
      console.error('[Reflow] Erro ao verificar aprovação:', err);
      // Se o refresh token estava realmente expirado, o próprio client do
      // Supabase já disparou SIGNED_OUT (pego pelo onAuthStateChange em
      // App.jsx) e a tela troca para o Login sozinha. Esta mensagem cobre o
      // caso em que a sessão local ainda é válida (ex.: falha de rede).
      setFeedback({ type: 'error', text: 'Não foi possível verificar sua sessão agora. Verifique sua conexão e tente novamente, ou saia e faça login novamente.' });
    } finally {
      setChecking(false);
    }
  };

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

        <div style={{
          marginTop: '1.75rem', display: 'flex', gap: '0.75rem',
          flexWrap: 'wrap', justifyContent: 'center', width: '100%'
        }}>
          <button
            onClick={handleCheckAgain}
            disabled={checking}
            className="btn-primary"
            style={{
              flex: '1 1 auto', minWidth: '180px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              opacity: checking ? 0.7 : 1,
              cursor: checking ? 'not-allowed' : 'pointer'
            }}
          >
            {checking ? (
              <div style={{
                width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.4)',
                borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 0.8s linear infinite'
              }} />
            ) : (
              <RefreshCw size={15} />
            )}
            {checking ? 'Verificando...' : 'Verificar novamente'}
          </button>

          <button
            onClick={onLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: 'none', border: 'none', color: '#b91c1c',
              fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', padding: '0.4rem 0.75rem'
            }}
          >
            <LogOut size={15} />
            Sair da Conta
          </button>
        </div>

        {feedback && (
          <div style={{
            marginTop: '1rem', width: '100%', display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
            padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.8rem', textAlign: 'left',
            backgroundColor: feedback.type === 'error' ? '#fef2f2' : '#fef3c7',
            border: `1px solid ${feedback.type === 'error' ? '#fecaca' : '#fde68a'}`,
            color: feedback.type === 'error' ? '#b91c1c' : '#92400e',
            boxSizing: 'border-box'
          }}>
            <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>{feedback.text}</span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
