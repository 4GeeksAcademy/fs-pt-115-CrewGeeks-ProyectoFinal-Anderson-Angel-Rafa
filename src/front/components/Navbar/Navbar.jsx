import { Link } from "react-router-dom";
// import { useLocation } from "react-router-dom";
import './Navbar.css'

export const Navbar = () => {

	// const location = useLocation()

	// const getButtonContent = () => {
	// 	switch(location.pathname) {
	// 		case '/':
	// 			return {text: 'LOGIN', to: '/login'};
	// 		case '/login':
	// 			return {text: 'VOLVER', to: '/' };
	// 		case '/profile':
	// 			return {text: 'CERRAR SESION', to: '/login'}
	// 		case '/holidays':
	// 			return {text: 'CERRAR SESION', to: '/login'}


	// 	}
	// }


	// const buttonConfig = getButtonContent()

	return (
		<header className="header-site">
			<div className="cg-container cg-nav">
				<div className="cg-brand">
					<div className="cg-brand-logo" aria-hidden="true"></div>
					<div className="cg-brand-name">CrewGeeks</div>
				</div>
				<nav className="cg-nav-links" aria-label="Primary">
					<a href="#features" className="cg-nav-link">Features</a>
					<a href="#euteams" className="cg-nav-link">Por qué nosotros</a>
					<a href="#contact" className="cg-nav-link">Contacto</a>
				</nav>
				<div className="cg-cluster">
					<a href="#trial" className="cg-btn cg-btn--primary">Login</a>
				</div>
			</div>
		</header>

	);
};

