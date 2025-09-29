import './Features.css'

export const Features = () => {
    return (
        <section id="features" className="cg-section">
            <div className="cg-container">
                <h2><strong>Todo lo que necesitas en una sola plataforma</strong></h2>
                <p className="cg-lead">Optimice sus procesos de RRHH con nuestro conjunto integral de herramientas diseñadas para lugares de trabajo modernos.</p>
                <div className="cg-features">
                    {/* features */}
                    <article className="cg-feature">
                        <div className="cg-icon-profile" aria-hidden="true"><i className="fa-solid fa-users" style={{color: '#3b82f6'}}></i></div>
                        <h3>Perfil de empleado</h3>
                        <p>Base de datos centralizada de empleados con roles, salarios y gestión integral de perfiles.</p>
                    </article>
                    <article className="cg-feature">
                        <div className="cg-icon-calendar" aria-hidden="true"><i className="fa-solid fa-calendar-days" style={{color: '#16a34a'}}></i></div>
                        <h3>Programación de turnos</h3>
                        <p>Sistema de programación inteligente con detección de conflictos y notificaciones automatizadas.</p>
                    </article>
                    <article className="cg-feature">
                        <div className="cg-icon-payroll" aria-hidden="true"><i className="fa-solid fa-euro-sign" style={{color: '#9333ea'}}></i></div>
                        <h3>Gestion de nóminas</h3>
                        <p>Procesamiento automatizado de nóminas con cumplimiento europeo y cálculos de impuestos.</p>
                    </article>
                    <article className="cg-feature">
                        <div className="cg-icon-holidays" aria-hidden="true"><i className="fa-solid fa-plane-departure" style={{color: '#ea580c'}}></i></div>
                        <h3>Gestión de vacaciones</h3>
                        <p>Solicitudes de vacaciones con flujos de trabajo de aprobación y seguimiento de estado.</p>
                    </article>
                    <article className="cg-feature">
                        <div className="cg-icon-suggestions" aria-hidden="true"><i className="fa-solid fa-lightbulb" style={{color: '#dc2626'}}></i></div>
                        <h3>Buzón de sugerencias</h3>
                        <p>Sistema de retroalimentación interna para capturar y gestionar las sugerencias de los empleados.</p>
                    </article>
                    <article className="cg-feature">
                        <div className="cg-icon-roles" aria-hidden="true"><i className="fa-solid fa-shield-halved" style={{color: '#4f46e5'}}></i></div>
                        <h3>Acceso basado en roles</h3>
                        <p>Arquitectura segura con roles de propietario, administrador/RRHH y empleado.</p>
                    </article>
                </div>
            </div>
        </section>
    )
}