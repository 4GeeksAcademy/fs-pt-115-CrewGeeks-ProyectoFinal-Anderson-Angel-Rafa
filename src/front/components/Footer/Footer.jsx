import './Footer.css'

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
					<a href="#features">Características</a>
					<a href="#recursos">Recursos</a>
					<a href="#seguridad">Seguridad</a>
				</div>
			</div>

			
			<div>
				<h4>Compañía</h4>
				<div className="cg-links">
					<a href="#about">Acerca de</a>
					<a href="#careers">Carreras</a>
					<a href="#contacto">Contacto</a>
				</div>
			</div>

			
			<div>
				<h4>Legal</h4>
				<div className="cg-links">
					<a href="#privacidad">Privacidad</a>
					<a href="#terminos">Términos</a>
					<a href="#rgpd">RGPD</a>
				</div>
			</div>

			
			<div>
				<h4>Cumplimiento</h4>
				<div className="cg-links">
					<a href="#cookies">Cookies</a>
					<a href="#seguridad">Seguridad</a>
					<a href="#accesibilidad">Accesibilidad</a>
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
