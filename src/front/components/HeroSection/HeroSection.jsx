import './HeroSection.css'

export const HeroSection = () => {
    return (
        <section className="cg-hero">
            <div className="cg-container cg-hero-grid">
                <div>
                    <h1 className='hero-tittle'>Simplifica tu gestión de <span className='hero-tittle-color'>recursos humanos</span> y tu <span className='hero-tittle-color'>fuerza laboral</span></h1>
                    <p>Plataforma integral para pequeñas y medianas empresas. Gestione empleados, nóminas, turnos y más con soluciones seguras y compatibles con el RGPD, diseñadas para equipos europeos.</p>
                    <div className="cg-hero-ctas">
                        <a className="cg-btn cg-btn--primary" href="#contact">Contacta con nosotros</a>
                    </div>
                    <p className="cg-trust"><i className="fa-solid fa-shield-halved" style={{color:' #22c55e'}}></i> Cumple con el RGPD</p>
                </div>
                <div className="cg-hero-image" aria-label="Product dashboard mockup">
                    <img src="plataforma.png" alt="" />
                </div>
            </div>
        </section>
    )
}