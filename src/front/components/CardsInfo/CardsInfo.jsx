import "./CardsInfo.css"

export const CardsInfo = () => {
    return (
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
    )
}