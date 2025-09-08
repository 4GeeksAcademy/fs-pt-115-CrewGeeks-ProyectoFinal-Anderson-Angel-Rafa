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

            <nav className="side-nav">
                <div className="nav-section">
                    <div className="nav-section-label">Principal</div>
                    <NavLink to="/profile" className="nav-item">
                        <span className="icon">🏠</span><span className="label">Dashboard</span>
                    </NavLink>
                    <NavLink to="/mi-perfil" className="nav-item">
                        <span className="icon">👤</span><span className="label">Mi perfil</span>
                    </NavLink>
                </div>

                <div className="nav-section">
                    <div className="nav-section-label">Trabajo</div>
                    <NavLink to="/nominas" className="nav-item"> Nominas </NavLink>
                    <NavLink to="/mi-horario" className="nav-item"> Mi Horario </NavLink>
                    <NavLink to="/registro-horas" className="nav-item"> Registro de horas </NavLink>
                </div>

                <div className="nav-section">
                    <div className="nav-section-label">Solicitudes</div>
                    <NavLink to="/vacaciones" className="nav-item">
                        <span className="icon">🏖️</span><span className="label">Vacaciones</span>
                        <span className="badge">2</span>
                    </NavLink>
                    <NavLink to="/bajas" className="nav-item"> Bajas medicas </NavLink>
                    <NavLink to="/permisos" className="nav-item"> Permisos </NavLink>
                </div>

                <div className="nav-section">
                    <div className="nav-section-label">Comunicación</div>
                    <NavLink to="/buzon" className="nav-item">
                        <span className="icon">📬</span><span className="label">Buzón</span>
                        <span className="badge warn">5</span>
                    </NavLink>
                    <NavLink to="/sugerencias" className="nav-item"> Sugerencias </NavLink>
                    <NavLink to="/documentos" className="nav-item"> Documentos </NavLink>
                </div>



            </nav>

        </div>
    );
};