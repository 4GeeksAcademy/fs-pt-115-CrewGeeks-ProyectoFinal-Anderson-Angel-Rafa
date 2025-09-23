import { Link } from "react-router-dom";
// import { useLocation } from "react-router-dom";
import './Navbar.css'
import { useAuth } from "../../hooks/useAuth";

export const Navbar = () => {

	const {token} = useAuth();



	return (
		<header className="header-site">
			<div className="cg-container cg-nav">
				<div className="cg-brand">
					<img className="cg-logo" src="src/front/assets/img/Logotipo.png" alt="logotipo" />
					<a href="/" className="cg-brand-name">CrewGeeks</a>
				</div>
				<div className="cg-cluster">
					<nav className="cg-nav-links" aria-label="Primary">
						<a href="#features" className="cg-nav-link">Features</a>
						<a href="#euteams" className="cg-nav-link">Por qué nosotros</a>
						<a href="#contact" className="cg-nav-link">Contacto</a>
					</nav>
					<a href="/login" className="cg-btn cg-btn--primary">{token ? "Dashboard" : "Login"}</a>
				</div>
			</div>
		</header>

	);
};

