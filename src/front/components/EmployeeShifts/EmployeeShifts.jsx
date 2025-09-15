import React, { useState } from 'react';
import {
  ChevronLeft, ChevronRight,
  Clock, Calendar, Users, AlertCircle,
  MessageSquare, FileText, Building
} from 'lucide-react';
import './EmployeeShifts.css';

function EmployeeShifts() {
  const [currentMonth, setCurrentMonth] = useState('January 2025');

  // Helpers para navegar meses
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const moveMonth = (delta) => {
    const [name, yearStr] = currentMonth.split(' ');
    const idx = MONTHS.indexOf(name);
    if (idx === -1) return;
    let y = parseInt(yearStr, 10), m = idx + delta;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0;  y += 1; }
    setCurrentMonth(`${MONTHS[m]} ${y}`);
  };

  // Top stats (tarjetas pequeñas)
  const stats = [
    { icon: Clock,    value: '168h', label: 'Total Hours',     color: 'blue'   },
    { icon: Clock,    value: '142h', label: 'Worked Hours',    color: 'green'  },
    { icon: Clock,    value: '26h',  label: 'Remaining Hours', color: 'yellow' },
    { icon: AlertCircle, value: '4h', label: 'Overtime Hours', color: 'orange' }
  ];

  const upcomingShifts = [
    { title: 'Today - Regular Shift',   time: '9:00 AM - 5:00 PM',  hours: '8 Hours', status: 'confirmed' },
    { title: 'Tomorrow - Evening Shift',time: '2:00 PM - 10:00 PM', hours: '8 Hours', status: 'scheduled' },
    { title: 'Jan 7 - Regular Shift',   time: '9:00 AM - 5:00 PM',  hours: '8 Hours', status: 'scheduled' },
    { title: 'Jan 14 - Morning Shift',  time: '6:00 AM - 2:00 PM',  hours: '8 Hours', status: 'scheduled' },
  ];

  const notifications = [
    { type: 'notice',     title: 'Schedule Change Notice', time: 'Today',       description: 'Your shift on January 15 has been rescheduled to 1:00 PM due to operational needs.' },
    { type: 'holiday',    title: 'Holiday Schedule',       time: 'Yesterday',   description: 'All regular shifts are cancelled for Monday. Check your schedule for updates.' },
    { type: 'meeting',    title: 'Team Meeting',           time: '2 days ago',  description: 'Mandatory team meeting on January 15 at 10:00 AM. Please reach out if you cannot attend.' },
    { type: 'opportunity',title: 'Overtime Opportunity',   time: '3 days ago',  description: 'Extra shifts available for the weekend. Contact HR if interested.' },
  ];

  const calendarDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Calendario de ejemplo (no ligado al día real)
  const generateCalendarDays = () => {
    const days = [];
    for (let i = 1; i <= 31; i++) {
      const shifts = [];
      if (i % 3 === 0) shifts.push({ type: 'regular', text: '9:00-17:00' });
      if (i % 5 === 0) shifts.push({ type: 'morning', text: '6:00-14:00' });
      if (i % 7 === 0) shifts.push({ type: 'evening', text: '14:00-22:00' });
      if (i === 20)  shifts.push({ type: 'holiday', text: 'Holiday' });
      days.push({ day: i, shifts });
    }
    return days;
  };
  const calendarData = generateCalendarDays();

  const monthlyStats = [
    { icon: Calendar,   value: '21', label: 'Working Days', color: 'blue' },
    { icon: Users,      value: '8',  label: 'Weekend Days', color: 'gray' },
    { icon: AlertCircle,value: '2',  label: 'Holiday Days', color: 'red'  },
  ];

  return (
    <div className="shifts-container">
      {/* Header */}
      <div className="shifts-header">
        <div className="shifts-title">
          <h1>My Schedule</h1>
          <p>View your work schedule for the current month.</p>
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

      {/* Stats */}
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
      </div>

      {/* Calendar */}
      <div className="calendar-section">
        <div className="calendar-header">
          <Calendar size={20} />
          <h2>Schedule Calendar</h2>
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

        <div className="calendar-legend">
          <div className="legend-item"><div className="legend-dot regular"></div><span>Regular Shift</span></div>
          <div className="legend-item"><div className="legend-dot morning"></div><span>Morning Shift</span></div>
          <div className="legend-item"><div className="legend-dot evening"></div><span>Evening Shift</span></div>
          <div className="legend-item"><div className="legend-dot holiday"></div><span>Holiday</span></div>
        </div>
      </div>

      {/* Bottom: Upcoming + Notes */}
      <div className="bottom-section">
        <div className="upcoming-shifts">
          <div className="section-header">
            <Clock size={20} />
            <h3>Upcoming Shifts</h3>
          </div>
          <div className="shifts-list">
            {upcomingShifts.map((s, i) => (
              <div className="shift-item" key={i}>
                <div className="shift-info">
                  <h4>{s.title}</h4>
                  <p>{s.time} • {s.hours}</p>
                </div>
                <span className={`shift-status ${s.status}`}>
                  {s.status === 'confirmed' ? 'Confirmed' : 'Scheduled'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="notes-reminders">
          <div className="section-header">
            <FileText size={20} />
            <h3>Schedule Notes & Reminders</h3>
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
            Need to Make Changes?
          </div>
          <div className="changes-actions">
            <button className="ask-btn">Ask Question</button>
            <button className="request-btn">Request Change</button>
          </div>
        </div>
        <div className="changes-description">
          Request schedule changes, report issues, or ask questions about your shifts.
        </div>
      </div>

      {/* Monthly Summary */}
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
      </div>
    </div>
  );
}

export default EmployeeShifts;
