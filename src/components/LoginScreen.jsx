import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { AlertCircle } from 'lucide-react';

export default function LoginScreen({ reason, onDismissReason } = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Mostra o motivo de um logout forçado (ex: conta excluída por um Admin)
  // uma única vez, depois avisa o pai para limpar — evita que a mensagem
  // reapareça numa sessão de login futura sem relação com o motivo original.
  useEffect(() => {
    if (reason) onDismissReason?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogleLogin = async () => {
    if (!isSupabaseConfigured()) {
      setError('O Supabase não está configurado. Verifique se VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão no seu arquivo .env');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const redirectUrl = `${window.location.origin}/auth/callback`;
      
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (authError) {
        throw authError;
      }
    } catch (err) {
      console.error('Erro no login com Google:', err);
      setError(err.message || 'Falha ao iniciar o login com o Google. Tente novamente.');
      setLoading(false);
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
      {/* Brand Header Logo */}
      <div style={{ marginBottom: '1.75rem', textAlign: 'center' }}>
        <img 
          src="/logo.webp" 
          alt="Reflow Logo" 
          style={{ height: '38px', maxWidth: '200px', objectFit: 'contain' }} 
        />
      </div>

      {/* Clean Centered Login Card */}
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e4e4e7',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.04), 0 4px 6px -4px rgba(0, 0, 0, 0.02)',
        padding: '2.5rem 2rem',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* Card Titles */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem', width: '100%' }}>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#18181b',
            letterSpacing: '-0.02em',
            margin: 0
          }}>
            Login
          </h1>
          <p style={{
            fontSize: '0.875rem',
            color: '#71717a',
            margin: '0.5rem 0 0 0',
            lineHeight: 1.45
          }}>
            Acesse o sistema utilizando sua conta do Google
          </p>
        </div>

        {/* Logout Reason Alert (ex: conta excluída por um Admin) */}
        {reason && (
          <div style={{
            width: '100%',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            backgroundColor: '#fef3c7',
            border: '1px solid #fde68a',
            borderRadius: '8px',
            color: '#92400e',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
            boxSizing: 'border-box'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{reason}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div style={{
            width: '100%',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#ef4444',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
            boxSizing: 'border-box'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        {/* Google OAuth Login Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            backgroundColor: '#ffffff',
            color: '#18181b',
            border: '1px solid #e4e4e7',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            transition: 'all 0.15s ease-in-out',
            opacity: loading ? 0.7 : 1
          }}
          onMouseOver={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = '#f4f4f5';
              e.currentTarget.style.borderColor = '#d4d4d8';
            }
          }}
          onMouseOut={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#e4e4e7';
            }
          }}
        >
          {loading ? (
            <>
              <div style={{
                width: '18px',
                height: '18px',
                border: '2px solid #d4d4d8',
                borderTopColor: '#18181b',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }} />
              <span>Conectando...</span>
            </>
          ) : (
            <>
              {/* Official Google Icon SVG */}
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continuar com o Google</span>
            </>
          )}
        </button>
      </div>

      {/* Footer info */}
      <div style={{ marginTop: '2rem', textAlign: 'center', color: '#a1a1aa', fontSize: '0.8rem' }}>
        © 2026 Reflow — Sistema de Gestão Escolar. Autenticação via Supabase Auth.
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
