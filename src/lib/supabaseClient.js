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
