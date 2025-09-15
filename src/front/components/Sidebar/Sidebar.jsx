import { NavLink } from "react-router-dom";
import './Sidebar.css'


export const Sidebar = () => {
    return (
        <div className="sidewrap">
            <div className="user-card">
                <div className="avatar">AS</div>
                <div className="user-meta">
                    <div className="user-name">Angel Sastre</div>
                    <div className="user-role">Empleado</div>
                </div>
            </div>

            <main className="side-nav">
                <div className="nav-section">
                    <div className="nav-section-label">Principal</div>
                    <NavLink to="/dashboard" className="nav-item">
                        <span className="label">Dashboard</span>
                    </NavLink>
                    <NavLink to="/profile" className="nav-item">
                        <span className="label">Mi perfil</span>
                    </NavLink>
                </div>

                <div className="nav-section">
                    <div className="nav-section-label">Trabajo</div>
                    <NavLink to="/payroll" className="nav-item"> Nominas </NavLink>
                    <NavLink to="/shifts" className="nav-item"> Mi Horario </NavLink>
                    <NavLink to="/TimeLog" className="nav-item"> Registro de horas </NavLink>
                </div>

                <div className="nav-section">
                    <div className="nav-section-label">Solicitudes</div>
                    <NavLink to="/holidays" className="nav-item">
                        <span className="label">Vacaciones</span>
                    </NavLink>                    
                </div>

                <div className="nav-section">
                    <div className="nav-section-label">Comunicación</div>
                    <NavLink to="/buzon" className="nav-item">
                        <span className="label">Buzón</span>
                    </NavLink>
                    <NavLink to="/sugerencias" className="nav-item"> Sugerencias </NavLink>                    
                </div>



            </main>

        </div>
    );
};