import "./InfoAbout.css"

export const InfoAbout = () => {

    return (
        <div className="about-me">
				<div className="about-me-wraper">
					<div className="about-me-text">
						<h2 className="title-About">Sobre CREWGEEKS</h2>
						<p className="about-p">
							En CrewGeeks transformamos la gestión de recursos humanos en una experiencia ágil, sencilla y eficiente.
							<br></br>
							Ofrecemos una plataforma única para administrar empleados, controlar nóminas, gestionar vacaciones y permisos en un solo lugar.
							<br></br>
							Nuestro modelo combina tecnología e innovación para que tu empresa ahorre tiempo, reduzca errores y potencie el talento de su equipo.
							Confiar en CrewGeeks es dar un paso hacia una gestión moderna, automatizada y transparente, donde las personas son el verdadero motor del éxito empresarial.
						</p>
					</div>
					<div className="about-me-img">
						<img src="src/front/assets/img/sobre-nosotros.jpg" alt="img-corp" loading="lazy" />
					</div>
				</div>
			</div>
    )
}