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
                email : '',
                password: ''
            });

            navigate('/profile')
            

        }

        

    };

    return (
       < section className='login-container'>
            <form className='login-form' onSubmit={handleSubmit}>
                <h2 className='login-tittle'>Iniciar Sesion</h2>


                <span className='form-group'>
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id='email'
                        name='email'
                        value={employeeData.email}
                        onChange={handleChange}
                        placeholder='Ingresa tu email'
                        required
                    />
                </span>

                <span className='form-group'>
                    <label htmlFor="password">Contraseña</label>
                    <input
                        type="password"
                        id='password'
                        name='password'
                        value={employeeData.password}
                        onChange={handleChange}
                        placeholder='Ingresa tu contraseña' 
                        required
                    />
                </span>

                <button type='submit' className='login-submit-btn'>Iniciar Sesión</button>
            </form>
        </section>
    );

}