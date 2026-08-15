/**
 * gmailService.js — Envio de e-mail via Supabase Edge Function
 *
 * O envio real acontece no servidor (supabase/functions/send-occurrence-email),
 * usando uma conta Gmail dedicada autenticada por refresh token — nunca no
 * navegador. Isso elimina duas coisas do fluxo antigo:
 *   1. Cada professor ter que autorizar o Gmail via OAuth no navegador;
 *   2. O fallback que vazava dados da ocorrência para um serviço de
 *      terceiro (formsubmit.co) quando o Gmail não estava conectado.
 */
import { supabase } from '../lib/supabaseClient';

export async function sendOccurrenceEmail({ to, subject, bodyHtml, bodyText }) {
  if (!supabase) {
    throw new Error('Supabase não está configurado — não é possível enviar e-mail.');
  }

  const { data, error } = await supabase.functions.invoke('send-occurrence-email', {
    body: { to, subject, bodyHtml, bodyText }
  });

  if (error) {
    throw error;
  }
  if (data?.error) {
    throw new Error(data.error);
  }

  return {
    id: data?.id || null,
    statusText: data?.statusText || 'E-mail enviado com sucesso'
  };
}
