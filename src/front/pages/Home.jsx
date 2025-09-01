import React, { useEffect } from "react"

import useGlobalReducer from "../hooks/useGlobalReducer.jsx";

export const Home = () => {

	return (
		<>
			<div className="slider-frame">
				<ul>
					<li><img src="src/front/assets/img/img-empresarios1.jpg" alt="" /></li>
					<li><img src="src/front/assets/img/img-empresarios2.jpg" alt="" /></li>
					<li><img src="src/front/assets/img/img-empresarios3.jpg" alt="" /></li>
					<li><img src="src/front/assets/img/img-empresarios4.jpg" alt="" /></li>
					<li><img src="src/front/assets/img/img-empresarios1.jpg" alt="" /></li>
				</ul>
			</div>

			<div className="about-me">
				<div className="about-me-wraper">
					<div className="about-me-text">
						<h2 className="title-About">Sobre CREWGEEKS</h2>
						<p className="about-p">
							En CrewGeeks transformamos la gestión de recursos humanos en una experiencia ágil, sencilla y eficiente.
							<br></br>
							Ofrecemos una plataforma única para administrar currículums, controlar nóminas, gestionar vacaciones y permisos en un solo lugar.
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

			<div>
				<section className="contenidos">
					<h2 className="cartas-contenidos">LO MEJOR PARA LA GESTIÓN DE TU EMPRESA</h2>

					<div className="contenido-grid">
						<article className="card card--personal">
							<div className="iconos-decarta"><img src="src/front/assets/img/silueta-de-multiples-usuarios.png" alt="" /></div>
							<h3 className="title-card">PERSONAL</h3>
							<p className="text-card">
								Gestionar tu personal es muy importante, y tus trabajadores podrán editar sus datos con un clic:
								foto personal, teléfono, datos de contacto, etc.
							</p>
						</article>

						<article className="card card--nominas">
							<div className="iconos-decarta"><img src="src/front/assets/img/salario.png" alt="" /></div>
							<h3 className="title-card">NÓMINAS</h3>
							<p className="text-card">Gestión rápida y segura para los cálculos de nómina de tus trabajadores.</p>
						</article>

						<article className="card card--cuadrantes">
							<div className="iconos-decarta"><img src="src/front/assets/img/calendario.png" alt="" /></div>
							<h3 className="title-card">CUADRANTES</h3>
							<p className="text-card">Organiza turnos y horarios de forma clara y automática.</p>
						</article>

						<article className="card card--vacaciones">
							<div className="iconos-decarta"><img src="src/front/assets/img/palmeraverano.png" alt="" /></div>
							<h3 className="title-card">VACACIONES</h3>
							<p className="text-card">Solicitudes y aprobaciones en tiempo real.</p>
						</article>

						<article className="card card--sugerencias">
							<div className="iconos-decarta"><img src="src/front/assets/img/sugerencia.png" alt="" /></div>
							<h3 className="title-card">SUGERENCIAS</h3>
							<p className="text-card">Recoge ideas y comentarios en un buzón digital.</p>
						</article>
					</div>
				</section>
			</div>
		</>
	);
}; 