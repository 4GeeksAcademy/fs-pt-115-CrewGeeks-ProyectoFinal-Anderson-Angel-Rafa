import { NavLink, useNavigate } from "react-router-dom";
import './Sidebar.css'
import { useAuth } from "../../hooks/useAuth";


export const Sidebar = () => {
    const {user, loading, logout} = useAuth()
    const navigate = useNavigate()

    if (loading || !user) {
        return <p>cargando...</p>
    }

    
    return (
        <div className="sidewrap">
            <div className="user-card">
                <div className="avatar">AS</div>
                <div className="user-meta">
                    <div className="user-name">{user.first_name} {user.last_name}</div>
                    <div className="user-role">{user.company}</div>
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
                    <NavLink to="/inbox" className="nav-item">
                        <span className="label">Buzón</span>
                    </NavLink>
                    <NavLink to="/suggestions" className="nav-item"> Sugerencias </NavLink>                    
                  
                </div>

                <NavLink className="nav-item" onClick={() => {logout(), navigate("/login")}}>Logout</NavLink>



            </main>

        </div>
    );
};