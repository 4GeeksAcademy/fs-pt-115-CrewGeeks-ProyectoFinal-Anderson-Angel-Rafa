import React, { useState } from 'react';
import {
  ChevronLeft, ChevronRight,
  Clock, Calendar, Users, AlertCircle,
  MessageSquare, FileText, Building
} from 'lucide-react';
import './EmployeeShifts.css';

export const EmployeeShifts = () => {
  const [currentMonth, setCurrentMonth] = useState('January 2025');

  const MONTHS_ES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const moveMonth = (delta) => {
    const raw = String(currentMonth || '').trim().replace(/\s+de\s+/i, ' ');
    const [rawName, yearStr] = raw.split(/\s+/);
    const name = (rawName || '').toLowerCase();


    let idx = MONTHS_ES.findIndex(m => m.toLowerCase() === name);
    if (idx === -1) idx = MONTHS_EN.findIndex(m => m.toLowerCase() === name);
    if (idx === -1) return;

    let y = parseInt(yearStr, 10) || new Date().getFullYear();
    let m = idx + delta;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }

    setCurrentMonth(`${MONTHS_ES[m]} ${y}`);
  };

  //  Top stats (tarjetas pequeñas)
  // const stats = [
  //   { icon: Clock,    value: '168h', label: 'Total Hours',     color: 'blue'   },
  //   { icon: Clock,    value: '142h', label: 'Worked Hours',    color: 'green'  },
  //   { icon: Clock,    value: '26h',  label: 'Remaining Hours', color: 'yellow' },
  //   { icon: AlertCircle, value: '4h', label: 'Overtime Hours', color: 'orange' }
  // ];

  const upcomingShifts = [
    { title: 'Hoy - Turno ordinario', time: '09:00 - 17:00', hours: '8 horas', status: 'confirmed' },
    { title: 'Mañana - Turno de tarde', time: '14:00 - 22:00', hours: '8 horas', status: 'scheduled' },
    { title: '7 ene - Turno ordinario', time: '09:00 - 17:00', hours: '8 horas', status: 'scheduled' },
    { title: '14 ene - Turno de mañana', time: '06:00 - 14:00', hours: '8 horas', status: 'scheduled' },
  ];


  const notifications = [
    { type: 'notice', title: 'Aviso de cambio de horario', time: 'Hoy', description: 'Tu turno del 15 de enero se ha reprogramado a las 13:00 por necesidades operativas.' },
    { type: 'holiday', title: 'Horario en festivo', time: 'Ayer', description: 'Se cancelan todos los turnos ordinarios del lunes. Revisa tu horario para ver las actualizaciones.' },
    { type: 'meeting', title: 'Reunión de equipo', time: 'Hace 2 días', description: 'Reunión de equipo obligatoria el 15 de enero a las 10:00. Si no puedes asistir, avisa.' },
    { type: 'opportunity', title: 'Oportunidad de horas extra', time: 'Hace 3 días', description: 'Hay turnos extra disponibles para el fin de semana. Contacta con RR. HH. si te interesa.' },
  ];

  const calendarDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  // Calendario de ejemplo (no ligado al día real)
  const generateCalendarDays = () => {
    const days = [];
    for (let i = 1; i <= 31; i++) {
      const shifts = [];
      if (i % 3 === 0) shifts.push({ type: 'regular', text: '9:00-17:00' });
      if (i % 5 === 0) shifts.push({ type: 'morning', text: '6:00-14:00' });
      if (i % 7 === 0) shifts.push({ type: 'evening', text: '14:00-22:00' });
      if (i === 20) shifts.push({ type: 'holiday', text: 'Holiday' });
      days.push({ day: i, shifts });
    }
    return days;
  };
  const calendarData = generateCalendarDays();

  const monthlyStats = [
    { icon: Calendar, value: '21', label: 'Working Days', color: 'blue' },
    { icon: Users, value: '8', label: 'Weekend Days', color: 'gray' },
    { icon: AlertCircle, value: '2', label: 'Holiday Days', color: 'red' },
  ];

  return (
    <section className='content-area'>
      <div className='content-header'>
        <div className='content-title'>Mis Horarios</div>
        <div className='content-subtitle'>Consulta tus horarios de trabajo el mes actual</div>
      </div>
      {/* Header */}
      <div className="shifts-container">
        <div className="shifts-header">
          <div className="shifts-title">
            {/* clase importada de content title data.css */}
          </div>
          <div className="month-selector">
            <button className="nav-btn" onClick={() => moveMonth(-1)}>
              <ChevronLeft size={16} />
            </button>
            <span>{currentMonth}</span>
            <button className="nav-btn" onClick={() => moveMonth(1)}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Stats
      <div className="stats-grid">
        {stats.map((s, i) => (
          <div className="stat-card" key={i}>          
            <div className={`stat-icon ${s.color}`}><s.icon size={20} /></div>
            <div className="stat-content">
              <h3>{s.value}</h3>
              <p>{s.label}</p>
            </div>
          </div>
        ))}
      </div> */}

        {/* Calendar */}
        <div className="calendar-section">
          <div className="section-header">
             <div className='section-title'>Calendario programado</div>
            <div className="calendar-header">
              <Calendar size={20} />             
            </div>
          </div>

          <div className="calendar-grid">
            {calendarDays.map((d) => (
              <div className="calendar-day-header" key={d}>{d}</div>
            ))}

            {calendarData.map((d) => (
              <div className="calendar-day" key={d.day}>
                <div className="day-number">{d.day}</div>
                {d.shifts.map((sh, idx) => (
                  <div className={`shift-block ${sh.type}`} key={idx}>{sh.text}</div>
                ))}
              </div>
            ))}
          </div>
          </div>
          <div className="calendar-legend">
            <div className="legend-item"><div className="legend-dot regular"></div><span>Turno ordinario</span></div>
            <div className="legend-item"><div className="legend-dot morning"></div><span>Turno de mañana</span></div>
            <div className="legend-item"><div className="legend-dot evening"></div><span>Turno de tarde</span></div>
            <div className="legend-item"><div className="legend-dot holiday"></div><span>Festivo</span></div>
          </div>
        

        {/* Bottom: Upcoming + Notes */}
        <div className="bottom-section">
          <div className="upcoming-shifts">
            <div className="section-header">
              <Clock size={20} />
              <h3>Proximos turnos</h3>
            </div>
            <div className="shifts-list">
              {upcomingShifts.map((s, i) => (
                <div className="shift-item" key={i}>
                  <div className="shift-info">
                    <h4>{s.title}</h4>
                    <p>{s.time} • {s.hours}</p>
                  </div>
                  <span className={`shift-status ${s.status}`}>
                    {s.status === 'confirmed' ? 'Confirmado' : 'Programado'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="notes-reminders">
            <div className="section-header">
              <FileText size={20} />
              <h3>Notas y recordatorios del horario</h3>
            </div>
            <div className="notes-list">
              {notifications.map((n, i) => (
                <div className={`note-item ${n.type}`} key={i}>
                  <div className="note-header">
                    <div>
                      <div className="note-title">{n.title}</div>
                      <div className="note-time">{n.time}</div>
                    </div>
                  </div>
                  <div className="note-description">{n.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Need to make changes */}
        <div className="changes-section">
          <div className="changes-header">
            <div className="changes-title">
              <MessageSquare size={20} />
              ¿Necesitas hacer cambios?
            </div>
            <div className="changes-actions">
              <button className="ask-btn">Preguntar</button>
              <button className="request-btn">Solicitar cambio</button>
            </div>
          </div>
          <div className="changes-description">
            Solicita cambios de horario, comunica incidencias o haz preguntas sobre tus turnos.
          </div>
        </div>

        {/* Monthly Summary
      <div className="monthly-summary">
        <div className="section-header">
          <Building size={20} />
          <h3>Monthly Summary</h3>
        </div>
        <div className="summary-content">
          <div className="summary-grid">
            {monthlyStats.map((s, i) => (
              <div className="summary-item" key={i}>
                <div className={`summary-icon ${s.color}`}><s.icon size={22} /></div>
                <div className="summary-number">{s.value}</div>
                <div className="summary-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div> */}
      </div>
    </section>
  );
};


