// EmployeeHolidays.jsx
// Versión para usuario con 22 días laborables disponibles fijos.
// El usuario no puede aprobar, denegar ni eliminar solicitudes; solo puede crear y editar las suyas.

import React, { useState, useMemo } from "react";
import "./EmployeeHolidays.css";
import "../EmployeeData/EmployeeData.css";

export const EmployeeHolidays = () => {
	// Formulario (inicio, fin, motivo)
	const [formulario, setFormulario] = useState({
		inicio: "",
		fin: "",
		motivo: "",
	});

	// Identificador de la solicitud en edición (null si no se edita)
	const [editId, setEditId] = useState(null);

	// Días disponibles base fijos para el usuario: 22 laborables
	const DIAS_DISPONIBLES_BASE = 22;

	// Festivos opcionales (YYYY-MM-DD)
	const FERIADOS = useMemo(() => new Set([]), []);

	// Lista de solicitudes
	const [solicitudes, setSolicitudes] = useState([]);

	// Función para contar días laborables (L-V), excluyendo festivos
	const contarLaborables = (inicioStr, finStr) => {
		if (!inicioStr || !finStr) return 0;
		const inicio = new Date(inicioStr);
		const fin = new Date(finStr);
		if (isNaN(inicio) || isNaN(fin) || fin < inicio) return 0;

		let count = 0;
		for (
			let d = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
			d <= fin;
			d.setDate(d.getDate() + 1)
		) {
			const dow = d.getDay(); // 0=Domingo, 6=Sábado
			const y = d.getFullYear();
			const m = String(d.getMonth() + 1).padStart(2, "0");
			const da = String(d.getDate()).padStart(2, "0");
			const iso = `${y}-${m}-${da}`;
			const esLaborable = dow >= 1 && dow <= 5 && !FERIADOS.has(iso);
			if (esLaborable) count++;
		}
		return count;
	};

	// Días laborables solicitados para la solicitud actual
	const diasSolicitados = useMemo(() => {
		return contarLaborables(formulario.inicio, formulario.fin);
	}, [formulario.inicio, formulario.fin, FERIADOS]);

	// Días usados (solicitudes aprobadas)
	const diasUsados = useMemo(() => {
		return solicitudes
			.filter((s) => s.estado === "APROBADO")
			.reduce((acc, s) => acc + s.dias, 0);
	}, [solicitudes]);

	// Días pendientes (solicitudes pendientes)
	const diasPendientes = useMemo(() => {
		return solicitudes
			.filter((s) => s.estado === "PENDIENTE")
			.reduce((acc, s) => acc + s.dias, 0);
	}, [solicitudes]);

	// Días restantes = 22 - (usados + pendientes)
	const diasRestantes = useMemo(() => {
		const resto = DIAS_DISPONIBLES_BASE - diasUsados - diasPendientes;
		return resto >= 0 ? resto : 0;
	}, [DIAS_DISPONIBLES_BASE, diasUsados, diasPendientes]);

	// Manejar cambios en el formulario
	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormulario((f) => ({ ...f, [name]: value }));
	};

	// Enviar nueva solicitud o actualizar una existente
	const handleSubmit = (e) => {
		e.preventDefault();
		if (!formulario.inicio || !formulario.fin || diasSolicitados <= 0) return;

		if (editId !== null) {
			// Actualizar solicitud existente
			setSolicitudes((prev) =>
				prev.map((s) =>
					s.id === editId
						? {
							...s,
							inicio: formulario.inicio,
							fin: formulario.fin,
							dias: diasSolicitados,
							motivo: formulario.motivo.trim(),
						}
						: s
				)
			);
			setEditId(null);
		} else {
			// Nueva solicitud (queda como PENDIENTE)
			const nueva = {
				id: Date.now(),
				inicio: formulario.inicio,
				fin: formulario.fin,
				dias: diasSolicitados,
				motivo: formulario.motivo.trim(),
				estado: "PENDIENTE",
			};
			setSolicitudes((prev) => [nueva, ...prev]);
		}

		// Reiniciar formulario
		setFormulario({ inicio: "", fin: "", motivo: "" });
	};

	// Activar modo edición para una solicitud
	const editarSolicitud = (solicitud) => {
		setFormulario({
			inicio: solicitud.inicio,
			fin: solicitud.fin,
			motivo: solicitud.motivo,
		});
		setEditId(solicitud.id);
	};

	return (

		<section className="content-area">
			<div className="content-header">
				<div className='content-title'>Vacaciones</div>				
				<div className="content-subtitle">Gestiona tus días de vacaciones y solicitudes</div>
			</div>
			{/* Estadísticas: disponibles, usados, pendientes, restantes */}
			<div className="content-body">
				<div className="employee-holidays__stats">
					<div className="cg-kpi">
						<div className="employee-holidays__icon employee-holidays__icon--available">
							<i className="fa-solid fa-umbrella-beach" aria-hidden="true"></i>
						</div>
						<div className="employee-holidays__content">
							<span className="employee-holidays__value">{DIAS_DISPONIBLES_BASE}</span>
							<span className="cg-action__label">Días disponibles</span>
						</div>
					</div>

					<div className="cg-kpi">
						<div className="employee-holidays__icon employee-holidays__icon--used">
							<i className="fa-solid fa-circle-check" aria-hidden="true"></i>
						</div>
						<div className="employee-holidays__content">
							<span className="employee-holidays__value">{diasUsados}</span>
							<span className="cg-action__label">Días usados</span>
						</div>
					</div>

					<div className="cg-kpi">
						<div className="employee-holidays__icon employee-holidays__icon--pending">
							<i className="fa-solid fa-hourglass-half" aria-hidden="true"></i>
						</div>
						<div className="employee-holidays__content">
							<span className="employee-holidays__value">{diasPendientes}</span>
							<span className="cg-action__label">Días pendientes</span>
						</div>
					</div>

					<div className="cg-kpi">
						<div className="employee-holidays__icon employee-holidays__icon--remaining">
							<i className="fa-solid fa-file-lines" aria-hidden="true"></i>
						</div>
						<div className="employee-holidays__content">
							<span className="employee-holidays__value">{diasRestantes}</span>
							<span className="cg-action__label">Días restantes</span>
						</div>
					</div>
				</div>

				{/* Formulario para solicitar vacaciones */}
				<form className="employee-holidays__form" onSubmit={handleSubmit}>
					<div className="employee-holidays__form-row">
						<label>
							Inicio:
							<input
								type="date"
								name="inicio"
								value={formulario.inicio}
								onChange={handleChange}
							/>
						</label>
						<label>
							Fin:
							<input
								type="date"
								name="fin"
								value={formulario.fin}
								onChange={handleChange}
								min={formulario.inicio || undefined}
							/>
						</label>
						<div>
							<span>Días laborables:</span>
							<span className="employee-holidays__dias">{diasSolicitados}</span>
						</div>
					</div>
					<label>
						Motivo (opcional):
						<textarea
							name="motivo"
							rows="2"
							value={formulario.motivo}
							onChange={handleChange}
							placeholder="Vacaciones familiares..."
						/>
					</label>
					<div className="employee-holidays__form-actions">
						<button className="request-btn" type="submit" disabled={diasSolicitados <= 0}>
							{editId !== null ? "Actualizar" : "Enviar solicitud"}
						</button>
						<button className="request-btn"
							type="button"
							onClick={() => {
								setFormulario({ inicio: "", fin: "", motivo: "" });
								setEditId(null);
							}}
						>
							Cancelar
						</button>
					</div>
				</form>

				{/* Listado de solicitudes */}
				
				<div className="ep-box ep-security">					
					<div className='section-title'>Solicitudes</div>
					{solicitudes.length === 0 ? (
						<p>No hay solicitudes</p>
					) : (
						<ul className="employee-holidays__list">
							{solicitudes.map((s) => (
								<li key={s.id} className="employee-holidays__item">
									<div>
										<strong>
											{s.inicio} — {s.fin}
										</strong>{" "}
										<span>({s.dias} días laborables)</span>
										{s.motivo && <span> · {s.motivo}</span>}
									</div>
									<span
										className={`employee-holidays__estado ${s.estado.toLowerCase()}`}
									>
										{s.estado}
									</span>
									<div className="employee-holidays__acciones">
										{/* 
                    🔒 Vista usuario: sin permisos para aprobar, denegar ni eliminar.
                    <button type="button" onClick={() => actualizarEstado(s.id, "APROBADO")}>Aprobar</button>
                    <button type="button" onClick={() => actualizarEstado(s.id, "DENEGADO")}>Denegar</button>
                    <button type="button" onClick={() => eliminarSolicitud(s.id)}>Eliminar</button>
                  */}
										<button
											type="button"
											className="employee-holidays__btn-edit"
											onClick={() => editarSolicitud(s)}
										>
											Editar
										</button>
									</div>
								</li>
							))}
						</ul>
					)}
				</div>
			</div>
		</section>
	);
};
