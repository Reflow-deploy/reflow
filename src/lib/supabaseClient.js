/**
 * supabaseClient.js — Cria a conexão com o Supabase (banco, login e tempo real).
 *
 * Usa a URL e a chave pública (anon) do arquivo .env. Todo código que fala com o banco importa
 * o objeto `supabase` exportado daqui.
 */

import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Normaliza a URL limpando /rest/v1/ ou barras no final
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');

// Conecta ao Supabase se as variáveis de ambiente existirem e forem válidas
export const supabase = (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('seu-projeto'))
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isSupabaseConfigured = () => Boolean(supabase);
