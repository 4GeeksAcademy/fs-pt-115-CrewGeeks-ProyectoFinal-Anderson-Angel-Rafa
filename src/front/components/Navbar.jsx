import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import "/workspaces/fs-pt-115-CrewGeeks-ProyectoFinal-Aaron-Anderson-Angel-Rafa/src/front/index.css"

export const Navbar = () => {

	const location = useLocation()

	const getButtonContent = () => {
		switch(location.pathname) {
			case '/':
				return {text: 'LOGIN', to: '/login'};
			case '/login':
				return {text: 'VOLVER', to: '/' };
			case '/profile':
				return {text: 'CERRAR SESION', to: '/login'}
			
		}
	}


	const buttonConfig = getButtonContent()

	return (
		<header>
			<nav>
				<div className="navbar">
					<div>
						<a className="name" href="#">CREWGEEKS</a>
						<a className="sub-Name" href="#">Te ayudamos con tu espacio de trabajo</a>
					</div>

				</div>
				<Link to ={buttonConfig.to}>
					<button className="btn button-Login">{buttonConfig.text}</button>
				</Link>
			</nav>
		</header>

	);
};
