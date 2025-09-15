import React, { useState } from 'react';
import { Clock, LogIn, LogOut, Coffee, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import './EmployeeTimeLog.css';

export const EmployeeTimeLog = () => {
        const [currentMonth, setCurrentMonth] = useState('Septiembre 2024');

        const timeEntries = [
                {
                        date: 'Dom 15',
                        day: 'Hoy',
                        entrada: '09:00',
                        salida: '--:--',
                        pausas: '45m',
                        horas: '8.5h',
                        extra: '--',
                        estado: 'activo'
                },
                {
                        date: 'Sáb 14',
                        day: '',
                        entrada: '--:--',
                        salida: '--:--',
                        pausas: '--',
                        horas: '--',
                        extra: '--',
                        estado: 'fin-semana'
                },
                {
                        date: 'Vie 13',
                        day: '',
                        entrada: '08:45',
                        salida: '17:30',
                        pausas: '1h 15m',
                        horas: '7.5h',
                        extra: '+14.5h',
                        estado: 'completado'
                },
                {
                        date: 'Jue 12',
                        day: '',
                        entrada: '09:15',
                        salida: '18:00',
                        pausas: '1h 30m',
                        horas: '7.25h',
                        extra: '--',
                        estado: 'completado'
                },
                {
                        date: 'Mié 11',
                        day: '',
                        entrada: '08:30',
                        salida: '19:15',
                        pausas: '2h 00m',
                        horas: '8.75h',
                        extra: '+1.75h',
                        estado: 'completado'
                },
                {
                        date: 'Mar 10',
                        day: '',
                        entrada: '09:00',
                        salida: '17:45',
                        pausas: '45m',
                        horas: '8.0h',
                        extra: '+1.0h',
                        estado: 'completado'
                },
                {
                        date: 'Lun 09',
                        day: '',
                        entrada: '08:45',
                        salida: '--',
                        pausas: '--',
                        horas: '7.0h',
                        extra: '--',
                        estado: 'completado'
                }
        ];

        const timelineEvents = [
                { type: 'entrada', label: 'Entrada', time: '09:00', icon: 'E' },
                { type: 'pausa', label: 'Pausa', time: '11:30 - 11:45', icon: 'P' },
                { type: 'almuerzo', label: 'Almuerzo', time: '13:00 - 14:00', icon: 'A' },
                { type: 'salida', label: 'Salida estimada', time: '17:00', icon: 'S' }
        ];

        return (
                <div className="timelog-container">
                        {/* Header */}
                        <div className="timelog-header">
                                <div className="header-left">
                                        <h1>Registro de Horarios</h1>
                                        <p>Controla y registra tus horas de trabajo diarias.</p>
                                </div>
                                <div className="header-right">
                                        <span className="month-selector">Septiembre 2024</span>
                                        <button className="clock-in-btn">
                                                <Clock size={16} />
                                                Fichar Entrada
                                        </button>
                                </div>
                        </div>

                        {/* Quick Actions */}   
                        <div>
                                {/* Wave Chart
                        <div className="wave-chart">
                                <div className="wave-point">
                                        <div className="wave-time">7h 24m</div>
                                        <div className="wave-label">Lunes</div>
                                </div>
                                <div className="wave-point">
                                        <div className="wave-time">8h</div>
                                        <div className="wave-label">Martes</div>
                                </div>
                                <div className="wave-point">
                                        <div className="wave-time">8.5h</div>
                                        <div className="wave-label">Miércoles</div>
                                </div>
                                <div className="wave-point">
                                        <div className="wave-time">7.5h</div>
                                        <div className="wave-label">Jueves</div>
                                </div>
                                <div className="wave-point">
                                        <div className="wave-time">8h</div>
                                        <div className="wave-label">Viernes</div>
                                </div>
                                <div className="wave-point">
                                        <div className="wave-time">--</div>
                                        <div className="wave-label">Sábado</div>
                                </div>
                                <div className="wave-point">
                                        <div className="wave-time">--</div>
                                        <div className="wave-label">Domingo</div>
                                </div>
                                <svg className="wave-svg" viewBox="0 0 100 20" preserveAspectRatio="none">
                                        <path d="M0,10 Q25,5 50,10 T100,10 L100,20 L0,20 Z" fill="rgba(255,255,255,0.1)" />
                                </svg>
                        </div> */}
                        </div>
                        
                        {/* Quick Actions */}
                        <div className="quick-actions">
                                <div className="action-card">
                                        <div className="action-icon green">
                                                <LogIn size={20} />
                                        </div>
                                        <div className="action-content">
                                                <h3>Fichar Entrada</h3>
                                                <p>Registra tu hora de entrada</p>
                                        </div>
                                </div>
                                <div className="action-card">
                                        <div className="action-icon red">
                                                <LogOut size={20} />
                                        </div>
                                        <div className="action-content">
                                                <h3>Fichar Salida</h3>
                                                <p>Registra tu hora de salida</p>
                                        </div>
                                </div>
                                <div className="action-card">
                                        <div className="action-icon yellow">
                                                <Coffee size={20} />
                                        </div>
                                        <div className="action-content">
                                                <h3>Iniciar Pausa</h3>
                                                <p>Pausa para descanso</p>
                                        </div>
                                </div>
                                <div className="action-card">
                                        <div className="action-icon blue">
                                                <Edit size={20} />
                                        </div>
                                        <div className="action-content">
                                                <h3>Entrada Manual</h3>
                                                <p>Editar registros manualmente</p>
                                        </div>
                                </div>
                        </div>

                        {/* Current Session */}
                        <div className="current-session">
                                <div className="session-card">
                                        <div className="session-header">
                                                <Clock size={20} />
                                                <h3>Estado Actual</h3>
                                        </div>
                                        <div className="status-indicator">
                                                <div className="status-dot"></div>
                                                <span>En horario laboral</span>
                                        </div>
                                        <div className="session-details">
                                                <div className="detail-row">
                                                        <span className="detail-label">Hora de entrada</span>
                                                        <span className="detail-value">09:00</span>
                                                </div>
                                                <div className="detail-row">
                                                        <span className="detail-label">Tiempo transcurrido</span>
                                                        <span className="detail-value highlight">4h 24m</span>
                                                </div>
                                                <div className="detail-row">
                                                        <span className="detail-label">Pausas realizadas</span>
                                                        <span className="detail-value">2 (45m total)</span>
                                                </div>
                                        </div>
                                </div>

                                <div className="session-card">
                                        <div className="session-header">
                                                <h3>Cronología del día</h3>
                                        </div>
                                        <div className="timeline-list">
                                                {timelineEvents.map((event, index) => (
                                                        <div key={index} className="timeline-item">
                                                                <div className={`timeline-icon ${event.type}`}>
                                                                        {event.icon}
                                                                </div>
                                                                <div className="timeline-content">
                                                                        <div className="timeline-type">{event.label}</div>
                                                                        <div className="timeline-time">{event.time}</div>
                                                                </div>
                                                        </div>
                                                ))}
                                        </div>
                                </div>
                        </div>

                        {/* Daily Log Table */}
                        <div className="daily-log">
                                <div className="log-header">
                                        <h3>Registro Diario - Septiembre 2024</h3>
                                        <div className="month-nav">
                                                <button className="nav-btn">
                                                        <ChevronLeft size={16} />
                                                </button>
                                                <span className="current-month">Septiembre 2024</span>
                                                <button className="nav-btn">
                                                        <ChevronRight size={16} />
                                                </button>
                                        </div>
                                </div>

                                <table className="log-table">
                                        <thead>
                                                <tr>
                                                        <th>Fecha</th>
                                                        <th>Entrada</th>
                                                        <th>Salida</th>
                                                        <th>Pausas</th>
                                                        <th>Horas Totales</th>
                                                        <th>Extra</th>
                                                        <th>Estado</th>
                                                </tr>
                                        </thead>
                                        <tbody>
                                                {timeEntries.map((entry, index) => (
                                                        <tr key={index}>
                                                                <td className="date-cell">
                                                                        {entry.date}
                                                                        {entry.day && <span className="day-label">{entry.day}</span>}
                                                                </td>
                                                                <td className="time-cell">{entry.entrada}</td>
                                                                <td className="time-cell">{entry.salida}</td>
                                                                <td className="time-cell">{entry.pausas}</td>
                                                                <td className="hours-cell">{entry.horas}</td>
                                                                <td className={`overtime-cell ${entry.extra.startsWith('-') ? 'negative' : ''}`}>
                                                                        {entry.extra}
                                                                </td>
                                                                <td>
                                                                        <span className={`status-badge ${entry.estado}`}>
                                                                                {entry.estado === 'activo' ? 'Activo' :
                                                                                        entry.estado === 'fin-semana' ? 'Fin de semana' : 'Completado'}
                                                                        </span>
                                                                </td>
                                                        </tr>
                                                ))}
                                        </tbody>
                                </table>                               
                        </div>
                </div>
        );
};