import React, { useEffect, useMemo, useState } from "react";
import "./EmployeeHolidays.css";
import "../EmployeeData/EmployeeData.css";
import { useAuth } from "../../hooks/useAuth";
import {
	getMyHolidayBalance,
	listHolidays,
	createHoliday,
	updateHoliday,
} from "../../services/holidaysAPI";

// Mapea estados de la API
const mapApiStatusToUi = (apiStatus) => {
	const up = String(apiStatus || "").toUpperCase();
	if (up === "APPROVED") return "APROBADO";
	if (up === "REJECTED") return "RECHAZADO";
	return "PENDIENTE"; // default
};

// formatear fechas ISO YYYY-MM-DD
const toIsoDate = (d) => {
	if (!d) return "";
	const year = d.getFullYear();
	const month = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

export const EmployeeHolidays = () => {
	const { token, user } = useAuth();

	// Formulario (inicio, fin, motivo)
	const [formulario, setFormulario] = useState({
		inicio: "",
		fin: "",
		motivo: "",
	});

	// Identificador de la solicitud en edición (null si no se edita)
	const [editId, setEditId] = useState(null);

	// Balance desde la API
	const [balance, setBalance] = useState({
		allocated_days: 22,
		used_days: 0,
		pending_days: 0,
		remaining_days: 22,
		year: new Date().getFullYear(),
	});

	// Festivos opcionales (YYYY-MM-DD)
	const FERIADOS = useMemo(() => new Set([]), []);

	// Lista de solicitudes (mapeadas a tu shape de UI)
	const [solicitudes, setSolicitudes] = useState([]);

	// Estados de carga/errores sencillos
	const [loading, setLoading] = useState(false);
	const [mensajeError, setMensajeError] = useState(null);
	const [mensajeOk, setMensajeOk] = useState(null);

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

	// Días laborables solicitados para la solicitud actual (cálculo local para feedback inmediato)
	const diasSolicitados = useMemo(() => {
		return contarLaborables(formulario.inicio, formulario.fin);
	}, [formulario.inicio, formulario.fin, FERIADOS]);

	// KPI: usados/pendientes/remaining los saco del balance para ser 100% fiel a backend
	const DIAS_DISPONIBLES_BASE = balance.allocated_days;
	const diasUsados = balance.used_days;
	const diasPendientes = balance.pending_days;
	const diasRestantes = balance.remaining_days;

	// Cargar balance y solicitudes
	const cargarDatos = async () => {
		if (!token) return;
		setLoading(true);
		setMensajeError(null);
		try {
			// Balance del año actual (puedes añadir selector de año si quieres)
			const balanceData = await getMyHolidayBalance(token, { year: new Date().getFullYear() });
			setBalance(balanceData);

			// Listado de mis holidays (la API ya filtra por usuario si no eres admin/hr)
			const holidays = await listHolidays(token);
			// Mapeo de API → UI (mantengo tus campos: id, inicio, fin, dias, motivo, estado)
			const mapped = holidays.map((h) => ({
				id: h.id,
				inicio: h.start_date,                 // "YYYY-MM-DD"
				fin: h.end_date,                      // "YYYY-MM-DD"
				dias: Number(h.requested_days || 0),  // entero
				motivo: h.reason || "",
				estado: mapApiStatusToUi(h.status),   // "PENDIENTE" | "APROBADO" | "RECHAZADO"
			}));
			// Orden opcional (más recientes primero por inicio)
			mapped.sort((a, b) => (b.inicio + b.fin).localeCompare(a.inicio + a.fin));
			setSolicitudes(mapped);
		} catch (error) {
			setMensajeError(error.message || "Error al cargar datos");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		cargarDatos();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [token]);

	// Manejar cambios en el formulario
	const handleChange = (event) => {
		const { name, value } = event.target;
		setFormulario((f) => ({ ...f, [name]: value }));
	};

	// Enviar nueva solicitud o actualizar una existente
	const handleSubmit = async (event) => {
		event.preventDefault();
		setMensajeOk(null);
		setMensajeError(null);

		if (!formulario.inicio || !formulario.fin || diasSolicitados <= 0) {
			setMensajeError("Rango de fechas inválido o sin días laborables.");
			return;
		}

		try {
			if (editId !== null) {
				// Actualizar solicitud existente (solo si sigue pendiente)
				const solicitudOriginal = solicitudes.find((s) => s.id === editId);
				if (!solicitudOriginal) {
					setMensajeError("No se encontró la solicitud a actualizar.");
					return;
				}
				if (solicitudOriginal.estado !== "PENDIENTE") {
					setMensajeError("Solo puedes editar solicitudes en estado PENDIENTE.");
					return;
				}

				await updateHoliday(token, editId, {
					start_date: formulario.inicio,
					end_date: formulario.fin,
					reason: formulario.motivo.trim(),
				});

				setMensajeOk("Solicitud actualizada correctamente.");
			} else {
				// Crear nueva solicitud
				await createHoliday(token, {
					start_date: formulario.inicio,
					end_date: formulario.fin,
					reason: formulario.motivo.trim(),
					employee_id: user?.id,
				});

				setMensajeOk("Solicitud enviada correctamente.");
			}

			// Reiniciar formulario y refrescar datos de backend
			setFormulario({ inicio: "", fin: "", motivo: "" });
			setEditId(null);
			await cargarDatos();
		} catch (error) {
			setMensajeError(error.message || "Error al enviar la solicitud");
		}
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
				<div className="content-title">Vacaciones</div>
				<div className="content-subtitle">Gestiona tus días de vacaciones y solicitudes</div>
			</div>

			<div className="content-body">
				{/* Mensajes simples */}
				{loading && <p>Cargando…</p>}
				{!loading && mensajeError && <p style={{ color: "#b91c1c" }}>{mensajeError}</p>}
				{!loading && mensajeOk && <p style={{ color: "#166534" }}>{mensajeOk}</p>}

				{/* Estadísticas: disponibles, usados, pendientes, restantes */}
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
								max={formulario.fin || undefined}
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
						<button className="request-btn" type="submit" disabled={diasSolicitados <= 0 || loading}>
							{editId !== null ? "Actualizar" : "Enviar solicitud"}
						</button>
						<button
							className="request-btn"
							type="button"
							onClick={() => {
								setFormulario({ inicio: "", fin: "", motivo: "" });
								setEditId(null);
								setMensajeError(null);
								setMensajeOk(null);
							}}
						>
							Cancelar
						</button>
					</div>
				</form>

				{/* Listado de solicitudes */}
				<div className="ep-box ep-security">
					<div className="section-title">Solicitudes</div>
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
									<span className={`employee-holidays__estado ${s.estado.toLowerCase()}`}>
										{s.estado}
									</span>
									<div className="employee-holidays__acciones">
										<button
											type="button"
											className="employee-holidays__btn-edit"
											onClick={() => editarSolicitud(s)}
											disabled={s.estado !== "PENDIENTE" || loading}
											title={s.estado !== "PENDIENTE" ? "Solo se pueden editar solicitudes pendientes" : "Editar"}
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
