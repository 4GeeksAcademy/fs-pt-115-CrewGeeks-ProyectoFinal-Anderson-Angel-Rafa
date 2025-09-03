import './LoginForm.css'

export const LoginForm = () => {


    return (
        <section className='login-container'>
            <form className='login-form'>
                <h2 className='login-tittle'>Iniciar Sesion</h2>

                <span className='form-group'>
                    <label htmlFor="companyId">ID de empresa</label>
                    <input
                        type="text"
                        id='companyId'
                        name='companyId'
                        //value={}
                        placeholder='Ingresa el ID de tu empresa'
                        required
                    />
                </span>

                <span className='form-group'>
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id='email'
                        name='email'
                        //value={}
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
                        //value={}
                        placeholder='Ingresa el ID de tu empresa'
                        required
                    />
                </span>

                <button type='submit' className='login-submit-btn'>Iniciar Sesión</button>
            </form>
        </section>
    );

}