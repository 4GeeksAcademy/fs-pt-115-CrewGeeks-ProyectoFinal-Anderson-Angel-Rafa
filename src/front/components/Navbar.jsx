import { Link } from "react-router-dom";
import "/workspaces/fs-pt-115-CrewGeeks-ProyectoFinal-Aaron-Anderson-Angel-Rafa/src/front/index.css"

export const Navbar = () => {

	return (
		<header>
			<nav>
				<div className="navbar">
					<div> 
						<a className="Name" href="#">CREWGEEKS</a>
						<a className="Sub_Name" href="#">Te ayudamos con tu epsacio de trabajo</a>
					</div>	
					
				</div>
				<button className="btn Button_Login" >LOG IN</button>
			</nav>
		</header>

	);
};
