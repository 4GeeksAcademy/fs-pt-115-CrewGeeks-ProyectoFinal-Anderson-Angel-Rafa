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
                <div className="cg-actions-grid">
                    <button className="cg-action" type="button" aria-label="Iniciar jornada">
                        <span className="cg-aicon cg-aicon--start" aria-hidden="true"><i className="fa-solid fa-play" style={{ color: "#16a34a" }}></i></span>
                        <span className="cg-action__label">Iniciar jornada</span>
                    </button>

                    <button className="cg-action" type="button" aria-label="Pausa o descanso">
                        <span className="cg-aicon cg-aicon--pause" aria-hidden="true"><i className="fa-solid fa-pause" style={{ color: "#ca8a04" }}></i></span>
                        <span className="cg-action__label">Pausa / Descanso</span>
                    </button>

                    <button className="cg-action" type="button" aria-label="Finalizar jornada">
                        <span className="cg-aicon cg-aicon--stop" aria-hidden="true"><i className="fa-solid fa-stop" style={{ color: "#dc2626" }}></i></span>
                        <span className="cg-action__label">Finalizar jornada</span>
                    </button>

                    <button className="cg-action" type="button" aria-label="Solicitar permiso">
                        <span className="cg-aicon cg-aicon--leave" aria-hidden="true"><i className="fa-solid fa-file-export" style={{ color: "#4f46e5" }}></i></span>
                        <span className="cg-action__label">Solicitar permiso</span>
                    </button>
                </div>
                <div className="cg-kpis-grid">

                    <article className="cg-kpi ">
                        <div className="cg-kpi-head">
                            <div className="cg-kpi-icon" aria-hidden="true"><i className="fa-solid fa-calendar" style={{ color: "#3b82f6" }}></i></div>
                            <h3 className="cg-kpi-title">Días trabajados</h3>
                        </div>
                        <div>
                        <div className="cg-kpi-value"><strong>23</strong></div>
                        </div>
                        <div className="cg-chip cg-chip--up">
                            +2 vs mes anterior
                        </div>
                    </article>
                    <article className="cg-kpi">
                        <div className="cg-kpi-head">
                            <div className="cg-kpi-icon" aria-hidden="true"><i className="fa-solid fa-hourglass-half" style={{ color: "#3b82f6" }}></i></div>
                            <h3 className="cg-kpi-title">Horas totales</h3>
                        </div>
                        <div className="cg-kpi-value"><strong>164h</strong></div>
                        <div className="cg-chip cg-chip--up">
                            +8h vs objetivo
                        </div>
                    </article>
                    <article className="cg-kpi">
                        <div className="cg-kpi-head">
                            <div className="cg-kpi-icon" aria-hidden="true"><i className="fa-solid fa-bullseye" style={{ color: "#3b82f6" }}></i></div>
                            <h3 className="cg-kpi-title">Puntualidad</h3>
                        </div>
                        <div>
                        <p className='cg-kpi-value'><strong>98%</strong></p>
                        </div>
                        <div className="cg-chip cg-chip--ok">
                            Excelente
                        </div>
                    </article>
                    <article className="cg-kpi">
                        <div className="cg-kpi-head">
                            <div className="cg-kpi-icon" aria-hidden="true"><i className="fa-solid fa-umbrella-beach" style={{ color: "#3b82f6" }}></i></div>
                            <h3 className="cg-kpi-title">Vacaciones restantes</h3>
                        </div>
                        <div className="cg-kpi-value"><strong>12</strong></div>
                        <div className="cg-chip cg-chip--down">
                            -3 usados
                        </div>
                    </article>
                </div>

                <div className='activity-section'>
                    <div className='section-header'>
                        <div className='section-title'>Actividad reciente</div>
                        <a href='#' className='section-action'>Ver todo →</a>
                    </div>

                    <div className='activity-list'>
                        <div className='activity-item'>
                            <div className='activity-icon success'><i className="fa-solid fa-check" style={{ color: "#10b981" }}></i></div>
                            <div className='activity-content'>
                                <div className='activity-title'>Jornada iniciada correctamente</div>
                                <div className='activity-desc'>Has fichado a las 09:00 AM</div>
                            </div>
                            <div className='activity-time'>Hace 2h</div>
                        </div>

                        <div className='activity-item'>
                            <div className='activity-icon info'><i className="fa-solid fa-file-invoice" style={{ color: "#3b82f6" }}></i></div>
                            <div className='activity-content'>
                                <div className='activity-title'>Nomina de Julio disponible</div>
                                <div className='activity-desc'>Ya puedes descargar tu nomina del mes</div>
                            </div>
                            <div className='activity-time'>Ayer</div>
                        </div>

                        <div className='activity-item'>
                            <div className='activity-icon warning'><i className="fa-solid fa-triangle-exclamation" style={{ color: "#fbbf24" }}></i></div>
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













