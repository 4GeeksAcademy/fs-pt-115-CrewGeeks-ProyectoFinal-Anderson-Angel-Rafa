import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import './LoginForm.css'
import { useNavigate } from 'react-router-dom';


export const LoginForm = () => {

    const {login, error, loading, token, user} = useAuth()
    const [userData, setUserData] = useState({})
    const navigate = useNavigate()



    const handleChange = (e) => {
        setUserData({...userData, [e.target.name]: e.target.value});
    }


    const handleSubmit = (e) => {
        e.preventDefault();
        login(userData)
       
    }
    
    useEffect(() => {
        if(token) {
            navigate("/dashboard")
        }
    }, [token])
    

    


    return (
        <section className="cg-auth">
            <div className="cg-auth-card">
                <div className='cg-container-title'>
                    <h1 className="cg-auth-title">Iniciar sesión</h1>
                    <p className="cg-auth-sub">Accede a tu portal de empleado.</p>
                </div>
                {error && <p>{error}</p>}
                <form className="cg-form" onSubmit={handleSubmit}>
                    <div className="cg-field">
                        <label className="cg-label" htmlFor="cg-email">Email</label>
                        <input className="cg-input" type="email" id="cg-email" name="email" autoComplete="email" onChange={handleChange} required />
                    </div>

                    <div className="cg-field">
                        <label className="cg-label" htmlFor="cg-password">Contraseña</label>
                        <input className="cg-input" type="password" id="cg-password" name="password" autoComplete="current-password" onChange={handleChange} required />
                    </div>

                    <div className="cg-row">
                        <label className="cg-remember">
                            <input type="checkbox" name="remember" /> Recuérdame
                        </label>
                        <a className="cg-link">¿Olvidaste tu contraseña?</a>
                    </div>

                    <div className="cg-actions">
                        <button className="cg-btn cg-btn--primary" type="submit">{loading ? "cargando..." : "Entrar"}</button>
                    </div>
                </form>
            </div>
        </section>

    );

}