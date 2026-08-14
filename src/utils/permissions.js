/**
 * permissions.js — Controle de Acesso por Cargo (Role-Based Access)
 * Define os cargos de conta disponíveis no sistema e quais áreas cada um pode acessar.
 */

export const ROLES = {
  ADMIN: 'Administrador',
  DIRECAO: 'Direção',
  PROFESSOR: 'Professor',
  SUPORTE: 'Equipe de Suporte',
  // Cargo automático de qualquer conta nova (ver migração de RLS / user_roles).
  // Sem acesso a nenhuma aba até um Administrador aprovar e definir o cargo real.
  PENDENTE: 'Pendente'
};

/**
 * Retorna a lista de abas do menu lateral que o cargo informado pode acessar.
 *
 * A "Equipe de Suporte" é a equipe técnica responsável por resolver falhas de
 * infraestrutura reportadas pela escola. Seu acesso é restrito exclusivamente
 * à Central de Ocorrências (visualizar chamados, limpar histórico e atualizar
 * o status dos chamados entre ABERTO e RESOLVIDO) — sem acesso ao Mapa
 * Interativo (alocação de salas) nem às Configurações.
 */
export function getAllowedTabs(role) {
  if (role === ROLES.SUPORTE) return ['occurrences'];
  if (!role || role === ROLES.PENDENTE) return [];
  return ['map', 'occurrences', 'settings'];
}

export function canAccessTab(role, tabId) {
  return getAllowedTabs(role).includes(tabId);
}
