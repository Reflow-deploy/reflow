import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function AuthCallback({ onAuthSuccess }) {
  const [status, setStatus] = useState('processing'); // 'processing' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    const handleCallback = async () => {
      if (!supabase) {
        if (mounted) {
          setStatus('error');
          setErrorMessage('Supabase não está configurado.');
        }
        return;
      }

      try {
        // Supabase JS client automatically parses URL hash/query in getSession() or onAuthStateChange()
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (session) {
          if (mounted) {
            setStatus('success');
          }
          // Notify parent & clean up URL
          setTimeout(() => {
            if (onAuthSuccess) {
              onAuthSuccess(session);
            }
            window.history.replaceState({}, document.title, '/');
          }, 800);
        } else {
          // Listen briefly for state change if session isn't available immediately
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
            if (newSession) {
              subscription.unsubscribe();
              if (mounted) {
                setStatus('success');
              }
              setTimeout(() => {
                if (onAuthSuccess) {
                  onAuthSuccess(newSession);
                }
                window.history.replaceState({}, document.title, '/');
              }, 800);
            }
          });

          // Timeout fallback
          setTimeout(() => {
            subscription.unsubscribe();
            if (mounted && status === 'processing') {
              window.history.replaceState({}, document.title, '/');
            }
          }, 4000);
        }
      } catch (err) {
        console.error('Erro no callback de autenticação:', err);
        if (mounted) {
          setStatus('error');
          setErrorMessage(err.message || 'Falha ao autenticar com o Google.');
        }
      }
    };

    handleCallback();

    return () => {
      mounted = false;
    };
  }, [onAuthSuccess]);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--background, #f8fafc)',
      color: 'var(--foreground, #1e293b)',
      fontFamily: 'var(--font-sans, sans-serif)',
      padding: '2rem'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        padding: '3rem 2.5rem',
        borderRadius: '1rem',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
        border: '1px solid var(--border, #e2e8f0)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        maxWidth: '420px',
        width: '100%'
      }}>
        {/* Reflow Logo */}
        <img 
          src="/logo.webp" 
          alt="Reflow Logo" 
          style={{ height: '36px', marginBottom: '2rem', objectFit: 'contain' }} 
        />

        {status === 'processing' && (
          <>
            <div style={{
              width: '48px',
              height: '48px',
              border: '3px solid #e2e8f0',
              borderTopColor: 'var(--primary, #0f2942)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              marginBottom: '1.5rem'
            }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary, #0f2942)', marginBottom: '0.5rem' }}>
              Autenticando...
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
              Por favor aguarde enquanto confirmamos suas credenciais do Google no Supabase.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#dcfce7',
              color: '#166534',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem'
            }}>
              <CheckCircle size={28} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#166534', marginBottom: '0.5rem' }}>
              Login Concluído!
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
              Redirecionando você para a aplicação...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#fef2f2',
              color: '#b91c1c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem'
            }}>
              <AlertCircle size={28} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#b91c1c', marginBottom: '0.5rem' }}>
              Erro na Autenticação
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem' }}>
              {errorMessage}
            </p>
            <button
              onClick={() => {
                window.history.replaceState({}, document.title, '/');
                window.location.reload();
              }}
              className="btn-primary"
              style={{ width: '100%' }}
            >
              Voltar ao Login
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
