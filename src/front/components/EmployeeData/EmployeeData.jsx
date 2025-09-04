import './EmployeeData.css'


export const EmployeeData = () => {







    return (
        <>
            <section className='data-container'>
                <div className='data-section'>
                    <span className=''>
                        <p><strong>Nombre :</strong></p>
                        <p><strong>Apellidos :</strong></p>
                        <p><strong>DNI/NIE :</strong></p>
                        <p><strong>Dirección :</strong></p>
                        <p><strong>Email :</strong></p>
                        <p><strong>Telefono :</strong></p>

                        <p><strong>Empresa :</strong></p>
                        <p><strong>Cargo :</strong></p>
                        <p><strong>Antigüedad :</strong></p>
                    </span>
                    <div>
                        <img className='img-employee' src="https://www.fotos-lienzo.es/blog/wp-content/uploads/2018/04/Taman%CC%83o-foto-carnet-espana.png" alt="" />
                    </div>
                </div>

            </section>
            <span className='data-edit-button'>
                <button className=''>Editar informacion</button>
            </span>
        </>
    );
};