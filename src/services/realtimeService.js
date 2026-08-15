import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import {
  mapSpaceRow,
  mapAllocationRow,
  mapOccurrenceRow,
  mapAuditLogRow,
  mapCollaboratorRow,
  mapClassRow
} from './supabaseService';

/**
 * realtimeService.js — Sincronização em Tempo Real (Supabase Realtime)
 *
 * loadInitialData() só roda uma vez, no mount de App.jsx — sem isso, uma
 * alocação/ocorrência/edição feita por um usuário nunca aparece pra outro
 * usuário já com a página aberta; ele só vê a mudança dando F5 (o que
 * dispara um novo mount e um novo loadInitialData). Este módulo assina os
 * eventos de postgres_changes do Supabase Realtime nas mesmas tabelas
 * carregadas por loadInitialData, para que INSERT/UPDATE/DELETE feitos por
 * qualquer usuário sejam propagados a todos os clientes conectados.
 *
 * A autorização de quais linhas cada cliente recebe continua sendo feita
 * pelas policies de RLS já existentes (is_approved() etc.) — o Realtime só
 * entrega a um cliente os eventos que a policy de SELECT dele permitiria
 * ler; nenhuma regra de segurança nova precisa ser criada aqui.
 */

/**
 * @param {object} handlers
 * @param {(eventType: 'INSERT'|'UPDATE'|'DELETE', row: object|null, oldRow: object) => void} handlers.onSpaceChange
 * @param {(eventType: 'INSERT'|'UPDATE'|'DELETE', row: object|null, oldRow: object) => void} handlers.onAllocationChange
 * @param {(eventType: 'INSERT'|'UPDATE'|'DELETE', row: object|null, oldRow: object) => void} handlers.onOccurrenceChange
 * @param {(eventType: 'INSERT'|'UPDATE'|'DELETE', row: object|null, oldRow: object) => void} handlers.onAuditLogChange
 * @param {(eventType: 'INSERT'|'UPDATE'|'DELETE', row: object|null, oldRow: object) => void} handlers.onCollaboratorChange
 * @param {(eventType: 'INSERT'|'UPDATE'|'DELETE', row: object|null, oldRow: object) => void} handlers.onClassChange
 * @returns {() => void} função de limpeza — cancela a inscrição (chamar no cleanup do useEffect)
 */
export function subscribeToChanges(handlers) {
  if (!isSupabaseConfigured()) return () => {};

  // payload.new só vem preenchido em INSERT/UPDATE; em DELETE só payload.old
  // existe (e, por padrão, só com a chave primária — suficiente pra todo
  // handler aqui, que sempre remove por id).
  const channel = supabase
    .channel('reflow-db-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'spaces' }, (payload) => {
      handlers.onSpaceChange?.(payload.eventType, payload.new?.id != null ? mapSpaceRow(payload.new) : null, payload.old);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'allocations' }, (payload) => {
      handlers.onAllocationChange?.(payload.eventType, payload.new?.id != null ? mapAllocationRow(payload.new) : null, payload.old);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'occurrences' }, (payload) => {
      handlers.onOccurrenceChange?.(payload.eventType, payload.new?.id != null ? mapOccurrenceRow(payload.new) : null, payload.old);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs' }, (payload) => {
      handlers.onAuditLogChange?.(payload.eventType, payload.new?.id != null ? mapAuditLogRow(payload.new) : null, payload.old);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'collaborators' }, (payload) => {
      handlers.onCollaboratorChange?.(payload.eventType, payload.new?.id != null ? mapCollaboratorRow(payload.new) : null, payload.old);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, (payload) => {
      handlers.onClassChange?.(payload.eventType, payload.new?.id != null ? mapClassRow(payload.new) : null, payload.old);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
