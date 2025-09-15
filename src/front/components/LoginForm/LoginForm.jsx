import './LoginForm.css'
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../services/authAPI';

export const LoginForm = () => {

    const navigate = useNavigate()

    const [employeeData, setEmployeeData] = useState({
        email: '',
        password: ''
    });

    const handleChange = (e) => {
        setEmployeeData({
            ...employeeData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        const result = await login(employeeData);

        if (result) {

            console.log('Login succesfully:', result);

            setEmployeeData({
                email: '',
                password: ''
            });

            navigate('/profile')


        }



    };

    return (
        <section className="cg-auth">
            <div className="cg-auth-card">
                <div className='cg-container-title'>
                    <h1 className="cg-auth-title">Iniciar sesión</h1>
                    <p className="cg-auth-sub">Accede a tu portal de empleado.</p>
                </div>

                <form className="cg-form">
                    <div className="cg-field">
                        <label className="cg-label" htmlFor="cg-email">Email</label>
                        <input className="cg-input" type="email" id="cg-email" name="email" autoComplete="email" required />
                    </div>

                    <div className="cg-field">
                        <label className="cg-label" htmlFor="cg-password">Contraseña</label>
                        <input className="cg-input" type="password" id="cg-password" name="password" autoComplete="current-password" required />
                    </div>

                    <div className="cg-row">
                        <label className="cg-remember">
                            <input type="checkbox" name="remember" /> Recuérdame
                        </label>
                        <a className="cg-link">¿Olvidaste tu contraseña?</a>
                    </div>

                    <div className="cg-actions">
                        <button className="cg-btn cg-btn--primary" type="submit">Entrar</button>
                    </div>
                </form>
            </div>
        </section>

    );

}