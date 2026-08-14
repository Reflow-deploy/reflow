/**
 * Serviço Event Emitter para desacoplamento de eventos do sistema APP REFLOW
 */

class EventService {
  constructor() {
    this.listeners = {};
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);

    // Retorna função de unsubscribe
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (err) {
          console.error(`Erro ao executar listener do evento ${event}:`, err);
        }
      });
    }
  }
}

export const eventService = new EventService();

// Constantes de Eventos do Sistema
export const EVENTS = {
  OCCURRENCE_CREATED: 'OCCURRENCE_CREATED',
  OCCURRENCE_RESOLVED: 'OCCURRENCE_RESOLVED',
  GMAIL_CONNECTED: 'GMAIL_CONNECTED'
};
