import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Users, AlertTriangle, Check, Repeat } from 'lucide-react';

// Helper: get real current time "HH:mm"
function getRealCurrentTime() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

// Helper: soma N dias a uma data "YYYY-MM-DD" sem passar por Date-UTC-parse.
// new Date("YYYY-MM-DD") interpreta a string como meia-noite UTC, o que
// desloca o dia da semana em fusos negativos como o do Brasil — aqui
// construímos o Date a partir das partes, que usa o fuso LOCAL do navegador.
function addDaysToDateStr(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

// Helper: nome do dia da semana em pt-BR, a partir de "YYYY-MM-DD" (mesmo
// cuidado de fuso local do helper acima).
function weekdayNameFromDateStr(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const names = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  return names[dt.getDay()];
}

// Gera as datas da série: a cada 7 dias a partir de startDateStr, até
// endDateStr inclusive. maxOccurrences é um teto de segurança contra erro
// de digitação na data final (~6 meses).
function buildRecurringDates(startDateStr, endDateStr, maxOccurrences = 26) {
  const dates = [];
  let current = startDateStr;
  while (current <= endDateStr && dates.length < maxOccurrences) {
    dates.push(current);
    current = addDaysToDateStr(current, 7);
  }
  return dates;
}

// Helper: get default end time (+90 mins)
function getDefaultEndTime(startStr) {
  if (!startStr) return '11:30';
  const [h, m] = startStr.split(':').map(Number);
  const totalMins = h * 60 + m + 90;
  const newH = Math.floor(totalMins / 60) % 24;
  const newM = totalMins % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

// Helper: convert HH:mm to minutes
function timeToMins(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export default function ModalReserveSpace({ space, classes, currentUser, onClose, onConfirm }) {
  if (!space) return null;

  const realCurrentTime = getRealCurrentTime();
  const todayDate = new Date().toISOString().split('T')[0];

  const [selectedClass, setSelectedClass] = useState(classes[0]?.name || '');
  const [date, setDate] = useState(todayDate);
  const [studentsCount, setStudentsCount] = useState(30);
  const [startTime, setStartTime] = useState(realCurrentTime);
  const [endTime, setEndTime] = useState(getDefaultEndTime(realCurrentTime));
  const [errorMsg, setErrorMsg] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');

  // Auto update end time when start time changes if not modified manually
  const handleStartTimeChange = (newStartTime) => {
    setStartTime(newStartTime);
    setEndTime(getDefaultEndTime(newStartTime));
  };

  const handleConfirm = (e) => {
    e.preventDefault();

    if (space.status === 'MANUTENCAO') {
      setErrorMsg('⚠️ Esta sala está em MANUTENÇÃO e não pode receber novas alocações.');
      return;
    }

    if (!selectedClass) {
      setErrorMsg('Selecione uma turma para prosseguir.');
      return;
    }

    if (Number(studentsCount) > space.capacity) {
      setErrorMsg(`Atenção: A quantidade de alunos (${studentsCount}) excede a capacidade máxima da sala (${space.capacity} alunos).`);
      return;
    }

    // 1. Validação de data passada
    if (date < todayDate) {
      setErrorMsg('⚠️ Não é possível realizar uma alocação para uma data que já passou! Escolha a data de hoje ou uma data futura.');
      return;
    }

    const startMins = timeToMins(startTime);
    const endMins = timeToMins(endTime);
    const nowMins = timeToMins(realCurrentTime);

    // 2. Validação de hora de término posterior ao início
    if (endMins <= startMins) {
      setErrorMsg('⚠️ Horário Inválido: A hora de término deve ser obrigatoriamente posterior à hora de início.');
      return;
    }

    // 3. Validação de hora passada no dia de hoje
    if (date === todayDate) {
      if (endMins <= nowMins) {
        setErrorMsg(`⚠️ Horário Passado: O horário de término (${endTime}) já passou! Seu horário atual de acesso é ${realCurrentTime}.`);
        return;
      }
      if (startMins < nowMins - 15) {
        setErrorMsg(`⚠️ Horário Passado: A hora de início (${startTime}) já passou em relação ao horário atual de acesso (${realCurrentTime}).`);
        return;
      }
    }

    // 4. Validação de recorrência (só quando "Repetir semanalmente" está
    //    marcado — o conflito de horário nesse caso é resolvido linha a
    //    linha no banco, não aqui: o snapshot scheduleToday só cobre hoje,
    //    insuficiente para validar N datas futuras).
    if (isRecurring) {
      if (!recurrenceEndDate) {
        setErrorMsg('Selecione até quando a reserva deve se repetir.');
        return;
      }
      const minEndDate = addDaysToDateStr(date, 7);
      if (recurrenceEndDate < minEndDate) {
        setErrorMsg(`⚠️ A data final da recorrência deve ser pelo menos 7 dias após ${date} (ao menos 2 ocorrências).`);
        return;
      }
      const maxEndDate = addDaysToDateStr(date, 7 * 26);
      if (recurrenceEndDate > maxEndDate) {
        setErrorMsg('⚠️ Período de recorrência muito longo (máximo de 26 semanas / ~6 meses por série).');
        return;
      }
    } else {
      // 5. Validação de conflito / choque de horários na mesma sala —
      //    só faz sentido pra reserva avulsa (série é validada no banco).
      const existingSchedule = space.scheduleToday || [];
      const conflict = existingSchedule.find(alloc => {
        if (alloc.date && alloc.date !== date) return false;
        const allocStart = timeToMins(alloc.startTime);
        const allocEnd = timeToMins(alloc.endTime);
        return (startMins < allocEnd) && (endMins > allocStart);
      });

      if (conflict) {
        setErrorMsg(`⚠️ Choque de Horários: Já existe um agendamento nesta sala (${conflict.class} com ${conflict.teacher}) das ${conflict.startTime} às ${conflict.endTime}.`);
        return;
      }
    }

    setErrorMsg('');
    const recurringDates = isRecurring ? buildRecurringDates(date, recurrenceEndDate) : [date];
    onConfirm({
      spaceId: space.id,
      teacher: currentUser?.name || 'Prof. Filipe Guimarães',
      class: selectedClass,
      students: Number(studentsCount),
      startTime,
      endTime,
      recurringDates,
      isRecurring
    });
  };

  return (
    <div className="modal-overlay animate-fade-in">
      <div className="card-reflow" style={{
        width: '100%',
        maxWidth: '480px',
        maxHeight: '90vh',
        padding: 0,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header fixo — sempre visível, mesmo com o formulário rolando
            (num celular, o card inteiro costuma ser mais alto que a
            tela, então isso evita perder o título/botão fechar) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.5rem 1.5rem 1rem 1.5rem',
          borderBottom: '1px solid #f1f5f9',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.1rem', color: '#0f2942' }}>
            <Calendar size={20} color="#0f2942" />
            Alocar Espaço / Reserva
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}>
            <X size={20} />
          </button>
        </div>

        {/* Conteúdo rolável — só esta parte rola, header e rodapé ficam fixos */}
        <form onSubmit={handleConfirm} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
        <div style={{ overflowY: 'auto', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Selected Space Info Badge */}
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '0.5rem',
          padding: '0.75rem',
          marginBottom: '0.75rem',
          fontSize: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontWeight: 700, color: '#0f2942' }}>
              📍 Espaço: {space.name} ({space.type})
            </span>
            <span style={{ backgroundColor: '#0b2238', color: '#ffffff', fontSize: '0.675rem', fontWeight: 800, padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>
              MÁX: {space.capacity} ALUNOS
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', fontSize: '0.73rem', marginTop: '0.4rem' }}>
            <span style={{ backgroundColor: space.deskType === 'Grupo' ? '#e0f2fe' : '#f1f5f9', color: space.deskType === 'Grupo' ? '#0369a1' : '#475569', fontWeight: 700, padding: '0.15rem 0.4rem', borderRadius: '0.25rem' }}>
              {space.deskType === 'Grupo' ? '👥 Mesas em Grupo' : space.deskType === 'Individual' ? '🪑 Mesas Individuais' : '🔄 Layout Misto'}
            </span>
            {space.equipments && space.equipments.map(eq => (
              <span key={eq} style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#334155', fontWeight: 600, padding: '0.15rem 0.4rem', borderRadius: '0.25rem' }}>
                {eq}
              </span>
            ))}
          </div>
        </div>

        {/* Realtime User Access Clock Banner */}
        <div style={{
          backgroundColor: '#e0f2fe',
          border: '1px solid #bae6fd',
          color: '#0369a1',
          padding: '0.5rem 0.75rem',
          borderRadius: '0.375rem',
          fontSize: '0.8rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          marginBottom: '1rem'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Clock size={14} color="#0284c7" />
            Horário Atual de Acesso:
          </span>
          <span style={{ fontWeight: 800, fontSize: '0.875rem', color: '#0369a1' }}>
            {realCurrentTime} hs
          </span>
        </div>

        {errorMsg && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '0.65rem 0.85rem', borderRadius: '0.375rem', fontSize: '0.8rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', lineHeight: '1.4' }}>
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <div>{errorMsg}</div>
          </div>
        )}

        {/* Form Fields */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
              Professor Responsável *
            </label>
            <input
              type="text"
              readOnly
              value={currentUser?.name || 'Prof. Filipe Guimarães'}
              style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '0.875rem', color: '#334155', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
              Turma / Ano *
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', fontSize: '0.875rem', backgroundColor: '#ffffff', outline: 'none' }}
            >
              {classes.map((c) => (
                <option key={c.id} value={c.name}>{c.name} ({c.studentsCount} alunos)</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
              Data do Agendamento
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', fontSize: '0.875rem', backgroundColor: '#ffffff', outline: 'none' }}
            />
          </div>

          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '0.5rem',
            padding: '0.75rem'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, color: '#0f2942' }}>
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <Repeat size={15} />
              Repetir semanalmente
            </label>

            {isRecurring && (
              <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                  Repete toda <strong>{weekdayNameFromDateStr(date)}</strong>
                </p>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                    Repetir até *
                  </label>
                  <input
                    type="date"
                    value={recurrenceEndDate}
                    onChange={(e) => setRecurrenceEndDate(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', fontSize: '0.875rem', backgroundColor: '#ffffff', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                {recurrenceEndDate && (
                  <p style={{ fontSize: '0.75rem', color: '#0369a1', fontWeight: 600, margin: 0 }}>
                    {buildRecurringDates(date, recurrenceEndDate).length} aula(s) serão agendadas
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
              Quantidade Estimada de Alunos
            </label>
            <input
              type="number"
              value={studentsCount}
              onChange={(e) => setStudentsCount(e.target.value)}
              placeholder={`Capacidade limite da sala: ${space.capacity} alunos`}
              style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', fontSize: '0.875rem', backgroundColor: '#ffffff', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                Hora de Início *
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', fontSize: '0.875rem', backgroundColor: '#ffffff', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                Hora de Término *
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', fontSize: '0.875rem', backgroundColor: '#ffffff', outline: 'none' }}
              />
            </div>
          </div>

        </div>

        {/* Rodapé fixo — Cancelar/Confirmar sempre acessíveis, mesmo com
            o formulário acima rolando (não fica preso lá embaixo do
            campo "Hora de Término" numa tela pequena) */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.75rem',
          padding: '1rem 1.5rem',
          borderTop: '1px solid #f1f5f9',
          flexShrink: 0
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{ backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 600, fontSize: '0.875rem', padding: '0.6rem 1.2rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            style={{ backgroundColor: '#15803d', color: '#ffffff', fontWeight: 600, fontSize: '0.875rem', padding: '0.6rem 1.4rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Check size={18} />
            Confirmar Reserva
          </button>
        </div>
        </form>
      </div>
    </div>
  );
}

