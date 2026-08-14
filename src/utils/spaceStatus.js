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

export function getRealTimeStatus(space, selectedDate) {
  if (!space) return { status: 'LIVRE', activeAllocation: null };

  // 1. Manutenção tem prioridade máxima
  if (space.status === 'MANUTENCAO') {
    return { status: 'MANUTENCAO', activeAllocation: null };
  }

  const allocations = space.scheduleToday || [];
  const currentMinutes = nowInMinutes();
  const today = todayDateString();
  const isToday = !selectedDate || selectedDate === today;

  // 2. Se existem alocações para esta sala
  if (allocations.length > 0) {
    if (isToday) {
      // Encontra uma alocação que esteja ativa AGORA (startTime <= agora < endTime)
      const activeNow = allocations.find(alloc => {
        const start = timeToMinutes(alloc.startTime);
        const end = timeToMinutes(alloc.endTime);
        return currentMinutes >= start && currentMinutes < end;
      });

      if (activeNow) {
        // Existe alocação ativa agora → sala OCUPADA
        return { status: 'OCUPADO', activeAllocation: activeNow };
      }

      // Verifica se há alocações futuras (ainda vão acontecer hoje)
      const futureAlloc = allocations.find(alloc => {
        const start = timeToMinutes(alloc.startTime);
        return currentMinutes < start;
      });

      if (futureAlloc) {
        // Há alocações futuras → sala LIVRE agora, mas mostra a próxima
        return { status: 'LIVRE', activeAllocation: futureAlloc };
      }

      // Todas as alocações do dia já expiraram → sala LIVRE
      return { status: 'LIVRE', activeAllocation: null };
    } else {
      // Visualizando outro dia — mostra a primeira alocação como referência
      return { status: 'OCUPADO', activeAllocation: allocations[0] };
    }
  }

  // 3. Se o banco marca OCUPADO mas não há alocações, respeita o DB
  if (space.status === 'OCUPADO') {
    return { status: 'OCUPADO', activeAllocation: null };
  }

  return { status: 'LIVRE', activeAllocation: null };
}
