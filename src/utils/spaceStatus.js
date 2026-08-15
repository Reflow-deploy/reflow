/**
 * spaceStatus.js — Utilitário de Status em Tempo Real
 * Calcula o status de uma sala respeitando o banco de dados e as alocações.
 */

export function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export function nowInMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export function todayDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function nowTimeString() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Calcula o status de uma sala numa combinação de data+hora — por padrão,
 * "agora" real, mas aceita uma data/hora arbitrária (usado pelo seletor de
 * data/hora do Mapa Interativo, pra checar disponibilidade futura).
 *
 * selectedTime é opcional (compat retroativa): quando ausente, usa o
 * relógio real (nowInMinutes()); só passa a ficar "congelado" numa hora
 * específica quando o call site informa selectedTime explicitamente.
 */
export function getRealTimeStatus(space, selectedDate, selectedTime) {
  if (!space) return { status: 'LIVRE', activeAllocation: null };

  // 1. Manutenção tem prioridade máxima
  if (space.status === 'MANUTENCAO') {
    return { status: 'MANUTENCAO', activeAllocation: null };
  }

  const today = todayDateString();
  const targetDate = selectedDate || today;
  const targetMinutes = selectedTime != null ? timeToMinutes(selectedTime) : nowInMinutes();

  // 2. Filtra SEMPRE por data primeiro — space.scheduleToday (apesar do
  //    nome) contém alocações de QUALQUER data, nunca deve ser comparado
  //    por horário sem filtrar pela data-alvo antes. alloc.date ausente
  //    (defensivo — coluna é NOT NULL no schema atual) é tratado como hoje.
  const allocations = (space.scheduleToday || []).filter(alloc => (alloc.date || today) === targetDate);

  if (allocations.length > 0) {
    const activeNow = allocations.find(alloc => {
      const start = timeToMinutes(alloc.startTime);
      const end = timeToMinutes(alloc.endTime);
      return targetMinutes >= start && targetMinutes < end;
    });

    if (activeNow) {
      return { status: 'OCUPADO', activeAllocation: activeNow };
    }

    // Próxima alocação a partir do horário-alvo, ordenada cronologicamente
    // (scheduleToday não vem garantidamente em ordem de horário).
    const futureAllocs = allocations
      .filter(alloc => timeToMinutes(alloc.startTime) > targetMinutes)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    if (futureAllocs.length > 0) {
      return { status: 'LIVRE', activeAllocation: futureAllocs[0] };
    }

    return { status: 'LIVRE', activeAllocation: null };
  }

  // 3. Status manual do banco não tem data associada — só respeitado
  //    quando a data-alvo é hoje, pra não vazar pra uma data futura/passada
  //    selecionada no mapa.
  if (targetDate === today && space.status === 'OCUPADO') {
    return { status: 'OCUPADO', activeAllocation: null };
  }

  return { status: 'LIVRE', activeAllocation: null };
}
