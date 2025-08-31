import { Link } from "react-router-dom";
import "/workspaces/fs-pt-115-CrewGeeks-ProyectoFinal-Aaron-Anderson-Angel-Rafa/src/front/index.css"

export const Navbar = () => {

	return (
		<header>
			<nav>
				<div className="navbar">
					<div> 
						<a className="title" href="#">CREWGEEKS</a>
						<a className="sub_Title" href="#">Te ayudamos con tu epsacio de trabajo</a>
					</div>	
					
				</div>
				<button className=" button_Login" >LOG IN</button>
			</nav>
		</header>

	);
};
