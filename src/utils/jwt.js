/**
 * jwt.js — Decodificação mínima de JWT (client-side)
 *
 * Usado para ler os claims do access_token emitido pelo Supabase Auth,
 * em especial o claim customizado `user_role` injetado pelo Custom Access
 * Token Hook (ver plano de segurança / migração SQL). Não faz nenhuma
 * verificação de assinatura — isso já foi validado pelo próprio Supabase
 * ao emitir o token; aqui só extraímos os dados públicos do payload.
 */
export function decodeJwt(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    return JSON.parse(json);
  } catch (e) {
    console.error('[Reflow] Erro ao decodificar JWT:', e);
    return null;
  }
}

/**
 * Extrai o cargo do usuário (claim `user_role`) a partir da sessão do Supabase.
 * Retorna null se o token não tiver o claim (ex: hook ainda não habilitado
 * no dashboard, ou usuário sem linha em user_roles).
 */
export function getRoleFromSession(session) {
  const claims = decodeJwt(session?.access_token);
  return claims?.user_role || null;
}
