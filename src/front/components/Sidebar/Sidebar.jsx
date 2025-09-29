import React, { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import "./Sidebar.css";
import { useAuth } from "../../hooks/useAuth";
import { useRole } from "../../auth/useRole"; // ← NUEVO

const PUBLIC_PATHS = new Set(["/", "/login"]);

export const Sidebar = () => {
    const location = useLocation();
    if (PUBLIC_PATHS.has(location.pathname)) return null;

    const { user, loading, logout } = useAuth();
    const { isOwnerDb, isAdmin, isHr } = useRole();     
    const isAdminPlus = isOwnerDb || isAdmin || isHr; 

    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate("/login");
        setIsOpen(false);
    };

    const handleNavClick = () => {
        if (isOpen) setIsOpen(false);
    };

    return (
        <>
            <main className="sidebar-container">
                <div
                    className={`sidewrap-backdrop ${isOpen ? "is-visible" : ""}`}
                    onClick={() => setIsOpen(false)}
                    aria-hidden="true"
                />
                <div
                    id="sidebar"
                    className={`sidewrap ${isOpen ? "is-open" : ""}`}
                    role="complementary"
                    aria-label="Menú lateral"
                >
                    <button
                        type="button"
                        className="sidewrap__close"
                        aria-label="Cerrar menú lateral"
                        onClick={() => setIsOpen(false)}
                    >
                        X
                    </button>

                    <div className="user-card">
                        <div>
                            <img className="avatar" src={user?.image || "rigo-baby.jpg"} alt="" />
                        </div>
                        <div className="user-meta">
                            <div className="user-name">{user?.first_name} {user?.last_name}</div>
                            <div className="user-role">{user?.company}</div>
                        </div>
                    </div>

                    <main className="side-nav" onClick={handleNavClick}>
                        {/* ===== Menú base (empleado / cualquier autenticado) ===== */}
                        <div className="nav-section">
                            <div className="nav-section-label">Principal</div>
                            <NavLink to="/dashboard" className="nav-item">
                                <span className="label">Dashboard</span>
                            </NavLink>
                            <NavLink to="/profile" className="nav-item">
                                <span className="label">Mi perfil</span>
                            </NavLink>
                        </div>
                        {/* ===== Bloque adicional SOLO para Owner/Admin/HR ===== */}
                        {isAdminPlus && (
                            <div className="nav-section">
                                <div className="nav-section-label">Administración</div>
                                <NavLink to="/adminEmpProfile" className="nav-item">Empleados</NavLink>
                                <NavLink to="/adminPayroll" className="nav-item">Subir nóminas</NavLink>
                                <NavLink to="/adminRequests" className="nav-item">Gestión de solicitudes</NavLink>
                                <NavLink to="/adminShiftAssignment" className="nav-item">Asignación de turnos</NavLink>
                            </div>
                        )}

                        <div className="nav-section">
                            <div className="nav-section-label">Trabajo</div>
                            <NavLink to="/payroll" className="nav-item">Nominas</NavLink>
                            <NavLink to="/shifts" className="nav-item">Mi Horario</NavLink>
                            <NavLink to="/TimeLog" className="nav-item">Registro de horas</NavLink>
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
                            <NavLink to="/suggestions" className="nav-item">Sugerencias</NavLink>
                        </div>


                        <button className="nav-item" type="button" onClick={handleLogout}>
                            <i className="fas fa-sign-out-alt icon" aria-hidden="true"></i>
                            <span>Logout</span>
                        </button>
                    </main>
                </div>

                <button
                    type="button"
                    className={`side-edge ${isOpen ? "is-hidden" : ""}`}
                    aria-label="Abrir menú lateral"
                    onClick={() => setIsOpen(true)}
                />
            </main>
        </>
    );
};

