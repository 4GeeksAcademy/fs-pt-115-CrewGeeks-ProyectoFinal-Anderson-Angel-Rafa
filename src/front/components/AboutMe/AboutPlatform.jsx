import './AboutPlatform.css'

export const AboutPlatform = () => {
    return (
        <section className="cg-eu" id="euteams">
            <div className="cg-container cg-eu-grid">

                <div>
                    <h2>Creado para equipos europeos</h2>
                    <p className="cg-lead">Plataforma compatible con GDPR diseñada específicamente para pequeñas y medianas empresas en Europa y España.</p>

                    <div className="cg-eu-rows">
                        <div className="cg-eu-row">
                            <div className="cg-eu-icon"><i className="fa-solid fa-circle-check" style={{color: '#3b82f6'}}></i></div>
                            <div className="cg-eu-text">
                                <div className="cg-eu-title">Arquitectura multinquilino</div>
                                <div className="cg-eu-sub">Aislamiento seguro de datos por empresa con infraestructura escalable.</div>
                            </div>
                        </div>

                        <div className="cg-eu-row">
                            <div className="cg-eu-icon"><i className="fa-solid fa-circle-check" style={{color: '#3b82f6'}}></i></div>
                            <div className="cg-eu-text">
                                <div className="cg-eu-title">Autenticación JWT</div>
                                <div className="cg-eu-sub">Seguridad de nivel empresarial con autenticación basada en token.</div>
                            </div>
                        </div>

                        <div className="cg-eu-row">
                            <div className="cg-eu-icon"><i className="fa-solid fa-circle-check" style={{color: '#3b82f6'}}></i></div>
                            <div className="cg-eu-text">
                                <div className="cg-eu-title">Listo para el RGPD</div>
                                <div className="cg-eu-sub">Cumplimiento total de la normativa europea de protección de datos.</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="cg-eu-photo">
                    <img src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1200&auto=format&fit=crop"
                        alt="Equipo reunido revisando KPIs de RRHH"/>
                </div>

            </div>
        </section>


    )
}