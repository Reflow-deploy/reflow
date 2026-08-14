/**
 * defaultData.js — Dados Padrão / Seed Data do Reflow
 * Fornece a base de dados padrão para inicialização e fallback da aplicação.
 */

export const DEFAULT_SPACES = [
  {
    id: 'sala-01',
    name: 'Sala de Aula 01',
    type: 'Sala de Aula',
    capacity: 30,
    block: 'Bloco A',
    status: 'LIVRE',
    svgGroupId: 'room-101',
    deskType: 'Individual',
    equipments: ['Projetor', 'Ar-condicionado', 'Lousa Digital'],
    scheduleToday: []
  },
  {
    id: 'sala-02',
    name: 'Sala de Aula 02',
    type: 'Sala de Aula',
    capacity: 30,
    block: 'Bloco A',
    status: 'LIVRE',
    svgGroupId: 'room-102',
    deskType: 'Individual',
    equipments: ['Projetor', 'Ar-condicionado', 'Lousa Digital'],
    scheduleToday: []
  },
  {
    id: 'sala-03',
    name: 'Sala de Aula 03',
    type: 'Sala de Aula',
    capacity: 30,
    block: 'Bloco A',
    status: 'LIVRE',
    svgGroupId: 'room-103',
    deskType: 'Individual',
    equipments: ['Projetor', 'Ar-condicionado', 'Lousa Digital'],
    scheduleToday: []
  },
  {
    id: 'sala-04',
    name: 'Sala de Aula 04',
    type: 'Sala de Aula',
    capacity: 30,
    block: 'Bloco B',
    status: 'LIVRE',
    svgGroupId: 'room-201',
    deskType: 'Individual',
    equipments: ['Projetor', 'Ar-condicionado', 'Lousa Digital'],
    scheduleToday: []
  },
  {
    id: 'sala-05',
    name: 'Sala de Aula 05',
    type: 'Sala de Aula',
    capacity: 30,
    block: 'Bloco B',
    status: 'LIVRE',
    svgGroupId: 'room-202',
    deskType: 'Individual',
    equipments: ['Projetor', 'Ar-condicionado', 'Lousa Digital'],
    scheduleToday: []
  },
  {
    id: 'sala-06',
    name: 'Sala de Aula 06',
    type: 'Sala de Aula',
    capacity: 30,
    block: 'Bloco B',
    status: 'LIVRE',
    svgGroupId: 'room-203',
    deskType: 'Individual',
    equipments: ['Projetor', 'Ar-condicionado', 'Lousa Digital'],
    scheduleToday: []
  },
  {
    id: 'lab-info',
    name: 'Laboratório de Informática',
    type: 'Laboratório',
    capacity: 30,
    block: 'Bloco A',
    status: 'LIVRE',
    svgGroupId: 'room-lab-info',
    deskType: 'Grupo',
    equipments: ['Projetor', 'Ar-condicionado', 'Lousa Digital', 'Computadores', 'Sistema de Som'],
    scheduleToday: []
  },
  {
    id: 'lab-ciencias',
    name: 'Laboratório de Ciências',
    type: 'Laboratório',
    capacity: 30,
    block: 'Bloco A',
    status: 'LIVRE',
    svgGroupId: 'room-lab-ciencias',
    deskType: 'Grupo',
    equipments: ['Projetor', 'Ar-condicionado', 'Lousa Digital', 'Computadores', 'Sistema de Som'],
    scheduleToday: []
  },
  {
    id: 'quadra',
    name: 'Quadra Poliesportiva',
    type: 'Esporte / Lazer',
    capacity: 60,
    block: 'Bloco B',
    status: 'LIVRE',
    svgGroupId: 'room-sports',
    deskType: 'Grupo',
    equipments: ['Arquibancada', 'Equipamentos Esportivos'],
    scheduleToday: []
  },
  {
    id: 'teatro',
    name: 'Teatro Escola',
    type: 'Auditório / Eventos',
    capacity: 80,
    block: 'Bloco B',
    status: 'LIVRE',
    svgGroupId: 'room-theater',
    deskType: 'Grupo',
    equipments: ['Projetor', 'Ar-condicionado', 'Sistema de Som', 'Palco', 'Iluminação'],
    scheduleToday: []
  },
  {
    id: 'biblioteca',
    name: 'Biblioteca Central',
    type: 'Biblioteca',
    capacity: 40,
    block: 'Bloco A',
    status: 'LIVRE',
    svgGroupId: 'room-library',
    deskType: 'Grupo',
    equipments: ['Ar-condicionado', 'Computadores de Pesquisa', 'Acervo de Livros'],
    scheduleToday: []
  },
  {
    id: 'auditorio',
    name: 'Auditório Principal',
    type: 'Auditório / Eventos',
    capacity: 100,
    block: 'Bloco B',
    status: 'LIVRE',
    svgGroupId: 'room-auditorium',
    deskType: 'Grupo',
    equipments: ['Projetor', 'Ar-condicionado', 'Sistema de Som', 'Lousa Digital'],
    scheduleToday: []
  }
];

export const DEFAULT_COLLABORATORS = [
  {
    id: 'col-1',
    initials: 'FG',
    name: 'Prof. Filipe Guimarães',
    status: 'PRESENTE',
    category: 'Docente',
    role: 'Professor de Tecnologia & Programação',
    email: 'filipe.guimaraes@reflow.edu.br',
    phone: '(11) 98765-4321',
    startTime: '07:30',
    endTime: '17:00',
    workDays: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'],
    notes: 'Coordenador do curso de Tecnologia'
  },
  {
    id: 'col-2',
    initials: 'RV',
    name: 'Profa. Regina Vasconcellos',
    status: 'PRESENTE',
    category: 'Docente',
    role: 'Professora de Química & Ciências',
    email: 'regina.vasconcellos@reflow.edu.br',
    phone: '(11) 97654-3210',
    startTime: '07:30',
    endTime: '13:00',
    workDays: ['Seg', 'Ter', 'Qua', 'Sex'],
    notes: 'Responsável pelo Lab. de Ciências'
  },
  {
    id: 'col-3',
    initials: 'MA',
    name: 'Marcio Alves',
    status: 'PRESENTE',
    category: 'Suporte',
    role: 'Técnico em Manutenção Predial & TI',
    email: 'marcio.alves@reflow.edu.br',
    phone: '(11) 96543-2109',
    startTime: '08:00',
    endTime: '17:00',
    workDays: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'],
    notes: 'Equipe de TI e Manutenção'
  },
  {
    id: 'col-4',
    initials: 'CL',
    name: 'Carla Lima',
    status: 'PRESENTE',
    category: 'Limpeza/Apoio',
    role: 'Supervisora de Serviços Gerais & Limpeza',
    email: 'carla.lima@reflow.edu.br',
    phone: '(11) 95432-1098',
    startTime: '06:00',
    endTime: '15:00',
    workDays: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'],
    notes: 'Equipe de Limpeza e Organização'
  },
  {
    id: 'col-5',
    initials: 'CS',
    name: 'Carlos Silva',
    status: 'PRESENTE',
    category: 'Direção',
    role: 'Diretor Escolar',
    email: 'carlos.silva@reflow.edu.br',
    phone: '(11) 94321-0987',
    startTime: '08:00',
    endTime: '18:00',
    workDays: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'],
    notes: 'Direção Geral da Escola Técnica'
  }
];

export const DEFAULT_CLASSES = [
  {
    id: 'class-1',
    name: '1º TDS - Técnico em Des. de Sistemas',
    studentsCount: 28
  },
  {
    id: 'class-2',
    name: '2º MA - Meio Ambiente',
    studentsCount: 25
  },
  {
    id: 'class-3',
    name: '3º ME - Mecânica Industrial',
    studentsCount: 30
  },
  {
    id: 'class-4',
    name: '1º Ano - Ensino Médio',
    studentsCount: 32
  },
  {
    id: 'class-5',
    name: '2º Ano - Ensino Médio',
    studentsCount: 30
  },
  {
    id: 'class-6',
    name: '3º Ano - Ensino Médio',
    studentsCount: 26
  }
];
