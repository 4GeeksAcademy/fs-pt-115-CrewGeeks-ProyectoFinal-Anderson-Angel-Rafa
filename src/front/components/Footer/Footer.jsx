import './Footer.css'
import { Link } from "react-router-dom";


export const Footer = () => (
	<footer className="cg-foot" id="contact">
		<div className="cg-container cg-foot-grid">

			<div>
				<div className="cg-brand">
					<img className='cg-logo' src="src/front/assets/img/Logotipo.png" alt="logotipo" />
					CrewGeeks
				</div>
				<p>Simplificando la gestión de RRHH para equipos europeos.</p>
			</div>


			<div>
				<h4>Producto</h4>
				<div className="cg-links">
					<Link to="/features#features">Características</Link>
					{/* <a href="#recursos">Recursos</a> */}
					{/* <Link to="/features#security">Seguridad</Link> */}
				</div>
			</div>


			<div>
				<h4>Compañía</h4>
				<div className="cg-links">
					<Link to="/features#about">Acerca de</Link>
					{/* <a href="#careers">Carreras</a>
					<a href="#contacto">Contacto</a> */}
				</div>
			</div>


			<div>
				<h4>Legal</h4>
				<div className="cg-links">
					<Link to="/features#privacy">Privacidad</Link>
					{/* <a href="#terminos">Términos</a>
					<a href="#rgpd">RGPD</a> */}
				</div>
			</div>


			<div>
				<h4>Cumplimiento</h4>
				<div className="cg-links">
					{/* <a href="#cookies">Cookies</a> */}
					<Link to="/features#security">Seguridad</Link>
					{/* <a href="#accesibilidad">Accesibilidad</a> */}
				</div>
			</div>
		</div>

		<div className="cg-container">
			<hr className="cg-foot-hr" />
			<div className="cg-foot-bottom">
				© 2025 CrewGeeks. Todos los derechos reservados.
			</div>
		</div>
	</footer>




);
