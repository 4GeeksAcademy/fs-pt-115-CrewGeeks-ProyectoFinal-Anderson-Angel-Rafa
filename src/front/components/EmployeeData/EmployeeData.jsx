import './EmployeeData.css'


export const EmployeeData = () => {


    return (
        <section className='content-area'>
            <div className='content-header'>
                <div className='content-title'>Dashboard</div>
                <div className='content-subtitle'>
                    Bienvenido de vuelta, aqui tienes tu resumen del dia
                </div>
            </div>


            <div className='content-body'>
                <div className='quick-actions'>
                    <a href='#' className='action-btn'>
                        <span className='action-btn-icon'>▶️</span>
                        <span className='action-btn-text'>Iniciar Jornada</span>
                    </a>
                    <a href='#' className='action-btn'>
                        <span className='action-btn-icon'>⏸️</span>
                        <span className='action-btn-text'>Pausa/Descanso</span>
                    </a>
                    <a href='#' className='action-btn'>
                        <span className='action-btn-icon'>⏹️</span>
                        <span className='action-btn-text'>Finalizar Jornada</span>
                    </a>
                    <a href='#' className='action-btn'>
                        <span className='action-btn-icon'>📄</span>
                        <span className='action-btn-text'>Solicitar Permiso</span>
                    </a>
                </div>

                <div className='metrics-grid'>
                    <div className='metric-card'>
                        <div className='metric-icon'>📅</div>
                        <div className='metric-value'>23</div>
                        <div className='metric-label'>Dias trabajados este mes</div>
                        <div className='metric-change positive'>+2 vs mes anterior</div>
                    </div>
                    <div className='metric-card'>
                        <div className='metric-icon'>⏰</div>
                        <div className='metric-value'>164h</div>
                        <div className='metric-label'>Horas totales</div>
                        <div className='metric-change positive'>+8h vs objeto</div>
                    </div>
                    <div className='metric-card'>
                        <div className='metric-icon'>🎯</div>
                        <div className='metric-value'>98%</div>
                        <div className='metric-label'>Puntualidad</div>
                        <div className='metric-change positive'>Excelente</div>
                    </div>
                    <div className='metric-card'>
                        <div className='metric-icon'>🏖️</div>
                        <div className='metric-value'>12</div>
                        <div className='metric-label'>Dias disponibles</div>
                        <div className='metric-change positive'>-3 usados</div>
                    </div>
                </div>





                <div className='activity-section'>
                    <div className='section-header'>
                        <div className='section-title'>Actividad reciente</div>
                        <a href='#' className='section-action'>Ver todo →</a>
                    </div>

                    <div className='activity-list'>
                        <div className='activity-item'>
                            <div className='activity-icon success'>✅</div>
                            <div className='activity-content'>
                                <div className='activity-title'>Jornada iniciada correctamente</div>
                                <div className='activity-desc'>Has fichado a las 09:00 AM</div>
                            </div>
                            <div className='activity-time'>Hace 2h</div>
                        </div>

                        <div className='activity-item'>
                            <div className='activity-icon info'>📄</div>
                            <div className='activity-content'>
                                <div className='activity-title'>Nomina de Julio disponible</div>
                                <div className='activity-desc'>Ya puedes descargar tu nomina del mes</div>
                            </div>
                            <div className='activity-time'>Ayer</div>
                        </div>

                        <div className='activity-item'>
                            <div className='activity-icon warning'>⚠️</div>
                            <div className='activity-content'>
                                <div className='activity-title'>Solicitud pendiente de aprobacion</div>
                                <div className='activity-desc'>
                                    tu solicitud de vacaciones esta en revision
                                </div>
                            </div>
                            <div className='activity-time'>HAce 3 dias</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};













