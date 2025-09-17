import React, { useState } from 'react';
import {Check, Filter, FileText, CheckCircle, XCircle, Calendar, Star, Settings, Clock, Euro, Building, Download, Eye, Mail} from 'lucide-react';
import './EmployeeInbox.css';

export const EmployeeInbox = () => {
    const [activeTab, setActiveTab] = useState('all');

    const messages = [
        {
            id: 1,
            type: 'payroll',
            category: 'payroll',
            title: 'Nuevo desprendible disponible',
            description: 'Tu nomina de Agosto 2024 ha sido procesada y ya esta disponible para descargar.', 
            time: '2 horas atras',
            amount: '2,456.40',
            isUnread: true,
            hasDownload: true,
            icon: FileText
        },
        {
            id: 2,
            type: 'holiday-approved',
            category: 'holidays',
            title: 'Nuevo mensaje de solicitud de vacaciones',
            description: 'Tu solicitud de vacaciones para el 15-19 de septiembre de 2024 ha sido aprobada por Recursos Humanos.',
            time: '5 horaas atras',
            days: '5 dias',
            isUnread: true,
            status: 'approved',
            icon: CheckCircle
        },
        {
            id: 3,
            type: 'holiday-rejected',
            category: 'holidays',
            title: 'Solicitud de vacaciones rechazada',
            description: 'Tu solicitud de vacaciones para los días del 28 al 30 de agosto de 2024 ha sido denegada por necesidades del servicio.',
            time: '1 dia atras',
            department: 'Departamento de Recursos Humanos',
            isUnread: false,
            status: 'rejected',
            icon: XCircle
        },
        {
            id: 4,
            type: 'schedule',
            category: 'Horario',
            title: 'Horario actualiz',
            description: 'Tu horario para la próxima semana se ha actualizado. Por favor, revisa los cambios.',
            time: '2 dias atras',
            week: 'Semana 34',
            isUnread: false,
            hasView: true,
            icon: Calendar
        },
        {
            id: 5,
            type: 'bonus',
            category: 'payroll',
            title: 'Prima por rendimiento concedida.',
            description: "¡Enhorabuena! Has recibido una prima por rendimiento por los logros del 2.º trimestre de 2024.",
            time: '3 dias atras',
            amount: '250.00',
            isUnread: false,
            status: 'bonus',
            icon: Star
        },
        {
            id: 6,
            type: 'system',
            category: 'system',
            title: 'Aviso de mantenimiento del sistema.',
            description: 'Mantenimiento programado el domingo 25 de agosto de 2:00 a 6:00. Se prevé acceso limitado.',
            time: '1 semana atras',
            department: 'Departamento de Informatica',
            isUnread: false,
            status: 'system',
            icon: Settings
        }
    ];

    const tabs = [
        { id: 'all', label: 'Todo', count: 12 },
        { id: 'payroll', label: 'Nominas', count: 3 },
        { id: 'holidays', label: 'Vacaciones', count: 4 },
        { id: 'schedule', label: 'Schedule', Horarios: 2 },
        { id: 'system', label: 'Sistema', count: 3 }
    ];

    const filteredMessages = activeTab === 'all'
        ? messages
        : messages.filter(msg => msg.category === activeTab);

    const renderMessageIcon = (message) => {
        const IconComponent = message.icon;
        return (
            <div className={`message-icon ${message.type}`}>
                <IconComponent size={20} />
            </div>
        );
    };

    const renderMessageActions = (message) => {
        const actions = [];

        if (message.hasDownload) {
            actions.push(
                <button key="download" className="action-btn download">
                    <Download size={12} />
                    Descargar
                </button>
            );
        }

        if (message.hasView) {
            actions.push(
                <button key="view" className="action-btn view">
                    <Eye size={12} />
                    Ver horarios
                </button>
            );
        }

        if (message.status) {
            let statusText = '';
            switch (message.status) {
                case 'approved': statusText = 'Aprobado'; break;
                case 'rejected': statusText = 'Rechazado'; break;
                case 'bonus': statusText = 'Bonificacion'; break;
                case 'system': statusText = 'Sistema'; break;
                default: statusText = message.status;
            }
            actions.push(
                <span key="status" className={`status-badge ${message.status}`}>
                    {statusText}
                </span>
            );
        }

        return actions;
    };

    const renderMessageMeta = (message) => {
        const meta = [];

        meta.push(
            <div key="time" className="message-time">
                <Clock size={12} />
                {message.time}
            </div>
        );

        if (message.amount) {
            meta.push(
                <div key="amount" className="message-amount">
                    <Euro size={12} />
                    {message.amount}
                </div>
            );
        }

        if (message.days) {
            meta.push(
                <div key="days" className="message-amount">
                    <Calendar size={12} />
                    {message.days}
                </div>
            );
        }

        if (message.week) {
            meta.push(
                <div key="week" className="message-amount">
                    <Calendar size={12} />
                    {message.week}
                </div>
            );
        }

        if (message.department) {
            meta.push(
                <div key="dept" className="message-department">
                    <Building size={12} />
                    {message.department}
                </div>
            );
        }

        return meta;
    };

    return (
        <div className="inbox-container">
            {/* Header */}
            <div className='content-header'>
                <h1>Buzon</h1>
                <p>Manten todas tus notificaciones y mennsajes importantes actualizadas.</p>   
                    
                    
                <div className="header-actions">
                    <button className="mark-read-btn">
                        <Check size={16} />
                        Marcar todo como leido
                    </button>
                    <button className="filter-btn">
                        <Filter size={16} />
                        Filtro
                    </button>
                </div>
                
                </div>        
            

            {/* Tabs */}
            <div className="inbox-tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                        <span className="tab-count">({tab.count})</span>
                    </button>
                ))}
            </div>

            {/* Messages List */}
            <div className="messages-list">
                {filteredMessages.length > 0 ? (
                    filteredMessages.map(message => (
                        <div
                            key={message.id}
                            className={`message-item ${message.isUnread ? 'unread' : ''}`}
                        >
                            <div className="message-header">
                                {renderMessageIcon(message)}
                                <div className="message-content">
                                    <div className="message-title">{message.title}</div>
                                    <div className="message-description">{message.description}</div>
                                    <div className="message-meta">
                                        {renderMessageMeta(message)}
                                    </div>
                                </div>
                                <div className="message-actions">
                                    {renderMessageActions(message)}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <Mail size={24} />
                        </div>
                        <h3>No messages found</h3>
                        <p>There are no messages in this category.</p>
                    </div>
                )}
            </div>
        </div>
    );
};