import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import './LoginForm.css';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

export const LoginForm = () => {
    const { login, error, loading, token, user } = useAuth();
    const [userData, setUserData] = useState({ email: "", password: "" });
    const [rememberMe, setRememberMe] = useState(true); // ← “Recuérdame”
    const navigate = useNavigate();

    const handleChange = (e) => {
        setUserData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const ok = await login(
            { email: userData.email.trim(), password: userData.password },
            { rememberMe }
        );
        if (!ok) {
            await Swal.fire({
                title: "Email o contraseña incorrectos",
                icon: "error",
                background: "#F8FAFC",
                color: "#121A2D",
                confirmButtonText: "Aceptar",
                confirmButtonColor: "#121A2D",
            });
        }
    };

    const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
        background: "#F8FAFC",
        color: "#121A2D",
    });

    const hasWelcomed = useRef(false);


    useEffect(() => {
        if (token && !hasWelcomed.current) {
            Toast.fire({
                icon: "success",
                title: `Bienvenido${user?.first_name ? `, ${user.first_name}` : ""}`,
            });
            hasWelcomed.current = true;
            navigate("/dashboard");
        }
    }, [token, navigate, user]);

    return (
        <section className="cg-auth">
            <div className="cg-auth-card">
                <div className='cg-container-title'>
                    <h1 className="cg-auth-title">Iniciar sesión</h1>
                    <p className="cg-auth-sub">Accede a tu portal de empleado.</p>
                </div>
                <form className="cg-form" onSubmit={handleSubmit}>
                    <div className="cg-field">
                        <label className="cg-label" htmlFor="cg-email">Email</label>
                        <input
                            className="cg-input"
                            type="email"
                            id="cg-email"
                            name="email"
                            autoComplete="email"
                            value={userData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="cg-field">
                        <label className="cg-label" htmlFor="cg-password">Contraseña</label>
                        <input
                            className="cg-input"
                            type="password"
                            id="cg-password"
                            name="password"
                            autoComplete="current-password"
                            value={userData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="cg-row">
                        <label className="cg-remember">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                            />{" "}
                            Recuérdame
                        </label>
                        <a className="cg-link">¿Olvidaste tu contraseña?</a>
                    </div>

                    <div className="cg-actions">
                        <button className="cg-btn cg-btn--primary" type="submit" disabled={loading}>
                            {loading ? "Cargando..." : "Entrar"}
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
};
