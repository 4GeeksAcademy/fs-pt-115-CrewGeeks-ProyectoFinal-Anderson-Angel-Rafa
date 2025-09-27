import './CallToAction.css'
import { Link } from "react-router-dom";


export const CallToAction = () => {
    return (
        <section className="cg-cta-dark" id="cta">
            <div className="cg-container">
                <h3 className="cg-cta-title">¿Está listo para transformar su gestión de RRHH?</h3>
                <p className="cg-cta-sub">
                    Únase a cientos de empresas europeas que ya utilizan CrewGeeks para optimizar la gestión de su fuerza laboral.
                </p>

                <div className="cg-cta-actions">
                    
                    <a href="/login" className="cg-btn cg-btn--primary">Comience a usar nuestro Software</a>
                    
                    
                    <a href="/features" className="cg-btn cg-btn--secondary">Programar demostración</a>
                    
                </div>
            </div>
        </section>

    )
}