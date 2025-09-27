import React, { useEffect, useMemo, useState } from "react";
import "./AdminShiftAssignment.css";

// 🔌 Ajusta estos imports a tu estructura real
import { getAllEmployees } from "../../services/employeesAPI"; // <-- cambia si tu archivo es otro
import {
	getShiftTypes,
	createSeries,
	listShifts,
	createShift,
	deleteShift,
	monthRange,
} from "../../services/shiftsAPI"; // <-- apunta a tu shiftsAPI.js

// 🔒 Mapeo de horas por code (por ahora en front; tu /types no trae horas)
const DEFAULT_HOURS_BY_CODE = {
	MORNING: { start_time: "06:00", end_time: "14:00" },
	EVENING: { start_time: "09:00", end_time: "17:00" },
	REGULAR: { start_time: "14:00", end_time: "22:00" },
	// HOLIDAY se oculta en esta pantalla
};

// 🤝 Utilidades
const pad2 = (n) => String(n).padStart(2, "0");
const toISO = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const addDays = (dateISO, days) => {
	const [y, m, d] = dateISO.split("-").map(Number);
	const base = new Date(y, m - 1, d);
	base.setDate(base.getDate() + days);
	return toISO(base);
};

const isWeekend = (dateISO) => {
	const [y, m, d] = dateISO.split("-").map(Number);
	const day = new Date(y, m - 1, d).getDay(); // 0=Dom..6=Sab
	return day === 0 || day === 6;
};

const overlaps = (aStart, aEnd, bStart, bEnd) => {
	// intervalos [start, end), mismo criterio que en el back
	return aStart < bEnd && bStart < aEnd;
};

export const AdminShiftAssignment = () => {
	// --- Estado UI original ---
	const [selectedEmployee, setSelectedEmployee] = useState("");
	const [selectedShiftTypeId, setSelectedShiftTypeId] = useState(""); // ahora guardamos id real del tipo
	const [weekRange, setWeekRange] = useState({ start: "", end: "" });
	const [excludeWeekends, setExcludeWeekends] = useState(false);
	const [overrideExisting, setOverrideExisting] = useState(false);
	const [notifyEmployee, setNotifyEmployee] = useState(true);
	const [additionalNotes, setAdditionalNotes] = useState("");

	// --- Nuevo: intervalo de semanas (series) ---
	const [intervalWeeks, setIntervalWeeks] = useState(1);

	// --- Datos del back ---
	const [employees, setEmployees] = useState([]);
	const [shiftTypes, setShiftTypes] = useState([]);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState(null);

	// Carga inicial de empleados + tipos
	useEffect(() => {
		let mounted = true;
		const load = async () => {
			setLoading(true);
			setError(null);
			try {
				const [emps, types] = await Promise.all([getAllEmployees(), getShiftTypes()]);
				if (!mounted) return;
				// Filtramos HOLIDAY para esta vista
				const usable = (types || []).filter((t) => t.code !== "HOLIDAY");

				setEmployees(emps || []);
				setShiftTypes(usable || []);
			} catch (e) {
				console.error("Init load failed:", e);
				if (mounted) setError(e.message || "Error al cargar datos");
			} finally {
				if (mounted) setLoading(false);
			}
		};
		load();
		return () => {
			mounted = false;
		};
	}, []);

	// Construir grid de tarjetas con tiempo por defecto (desde code)
	const shiftTypeCards = useMemo(() => {
		return (shiftTypes || []).map((t) => {
			const defaults = DEFAULT_HOURS_BY_CODE[t.code] || null;
			const timeLabel = defaults ? `${defaults.start_time} - ${defaults.end_time}` : "—";
			return {
				id: String(t.id),
				code: t.code,
				name: t.name,
				color: t.color_hex,
				timeLabel,
			};
		});
	}, [shiftTypes]);

	const selectedTypeObj = useMemo(
		() => shiftTypes.find((t) => String(t.id) === String(selectedShiftTypeId)) || null,
		[shiftTypes, selectedShiftTypeId]
	);

	const defaultHoursForSelected = useMemo(() => {
		if (!selectedTypeObj) return null;
		return DEFAULT_HOURS_BY_CODE[selectedTypeObj.code] || null;
	}, [selectedTypeObj]);

	const getWeeksInRange = () => {
		if (!weekRange.start || !weekRange.end) return 0;
		const start = new Date(weekRange.start);
		const end = new Date(weekRange.end);
		const diff = Math.abs(end - start);
		return Math.ceil(diff / (1000 * 60 * 60 * 24 * 7));
	};

	// Fechas a procesar según el rango y excludeWeekends
	const enumerateDates = (startISO, endISO, excludeWknds) => {
		if (!startISO || !endISO) return [];
		let cursor = startISO;
		const result = [];
		while (cursor <= endISO) {
			if (!excludeWknds || !isWeekend(cursor)) result.push(cursor);
			cursor = addDays(cursor, 1);
		}
		return result;
	};

	// El “modo serie” crea una regla, el “modo override” crea día a día y borra solapes explícitos
	const handleAssignShift = async () => {
		if (!selectedEmployee || !selectedShiftTypeId || !weekRange.start || !weekRange.end) {
			alert("Por favor completa todos los campos obligatorios");
			return;
		}
		if (!defaultHoursForSelected) {
			alert("Este tipo de turno no tiene horas por defecto configuradas.");
			return;
		}
		if (!Number.isInteger(Number(intervalWeeks)) || Number(intervalWeeks) < 1) {
			alert("Intervalo de semanas debe ser un entero positivo (mínimo 1).");
			return;
		}

		setSubmitting(true);
		setError(null);

		try {
			const typeId = Number(selectedShiftTypeId);
			const { start_time, end_time } = defaultHoursForSelected;

			if (!overrideExisting) {
				// ---- SERIE RECURRENTE ----
				const weekdays = excludeWeekends
					? ["MO", "TU", "WE", "TH", "FR"]
					: ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];

				await createSeries({
					employee_id: Number(selectedEmployee),
					type_id: typeId,
					start_date: weekRange.start,
					end_date: weekRange.end,
					start_time,
					end_time,
					weekdays,
					interval_weeks: Number(intervalWeeks),
					tz_name: "Europe/Madrid",
					notes: additionalNotes || undefined,
				});

				alert("Serie creada correctamente");
			} else {
				// ---- DÍA A DÍA + OVERRIDE EXPLÍCITOS ----
				const days = enumerateDates(weekRange.start, weekRange.end, excludeWeekends);

				// Para cada día: buscamos explícitos de ese día, borramos los que solapen y creamos el nuevo
				for (const dayISO of days) {
					// 1) Traemos turnos de ese día para el empleado
					const shifts = await listShifts({
						from: dayISO,
						to: dayISO,
						employeeId: Number(selectedEmployee),
					});

					// 2) Identificamos explícitos (los que tienen id != null y no generated) que solapen
					const explicitSameDay = (shifts || []).filter(
						(s) => s.id != null && !s.generated && s.date === dayISO
					);

					const toDelete = explicitSameDay.filter((s) =>
						overlaps(start_time, end_time, s.start_time, s.end_time)
					);

					// 3) Borramos solapados
					for (const s of toDelete) {
						await deleteShift(s.id);
					}

					// 4) Creamos el turno de ese día
					await createShift({
						employee_id: Number(selectedEmployee),
						type_id: typeId,
						date: dayISO,
						start_time,
						end_time,
						notes: additionalNotes || undefined,
						status: "planned",
					});
				}

				alert("Turnos asignados (día a día) con sobrescritura de conflictos.");
			}

			// Reset suave opcional (mantiene selección de tipo)
			setAdditionalNotes("");
			setNotifyEmployee(true);
		} catch (e) {
			console.error("Asignación fallida:", e);
			setError(e.message || "No se pudo asignar el turno");
			alert(e.message || "No se pudo asignar el turno");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<section className="content-area admin-shift-assignment">
			<div className="content-header">
				<div className="content-title">Asignación de Turnos</div>
				<div className="content-subtitle">
					Asigna horarios específicos a los empleados para períodos determinados.
				</div>
			</div>

			<div className="content-body">
				<div className="shift-assignment-container">
					<div className="assignment-form-section">
						<div className="section-header">
							<div className="section-title">
								<i className="fa-solid fa-user-plus" />
								Nueva Asignación de Turno
							</div>
						</div>

						{loading ? (
							<div className="form-content">Cargando…</div>
						) : error ? (
							<div className="form-content">
								<div className="error-badge">{error}</div>
							</div>
						) : (
							<div className="form-content">
								{/* Empleado */}
								<div className="form-row">
									<div className="form-group">
										<label className="form-label">Seleccionar Empleado</label>
										<select
											className="form-select"
											value={selectedEmployee}
											onChange={(e) => setSelectedEmployee(e.target.value)}
										>
											<option value="">Selecciona un empleado...</option>
											{employees.map((emp) => {
												const fullName =
													emp.full_name ||
													[emp.first_name, emp.last_name].filter(Boolean).join(" ");
												const position = emp.position || emp.role?.name || "";
												return (
													<option key={emp.id} value={emp.id}>
														{fullName} {position ? `- ${position}` : ""}
													</option>
												);
											})}
										</select>
										{/* Intervalo de semanas */}
										<div className="form-row">
											<div className="form-group">
												<label className="form-label">Intervalo de semanas</label>
												<input
													type="number"
													min={1}
													step={1}
													className="form-input"
													value={intervalWeeks}
													onChange={(e) => setIntervalWeeks(e.target.value)}
													disabled={overrideExisting}
													placeholder="1 = todas las semanas, 2 = semanas alternas…"
												/>
												<div className="hint">
													1 = todas las semanas · 2 = semanas alternas · 3 = cada 3 semanas
												</div>
											</div>
										</div>
									</div>
									<div className="form-group">
										<label className="form-label">Tipo de Horario</label>
										<div className="shift-types-grid">
											{shiftTypeCards.map((shift) => (
												<div
													key={shift.id}
													className={`shift-type-card ${String(selectedShiftTypeId) === String(shift.id) ? "selected" : ""
														}`}
													onClick={() => setSelectedShiftTypeId(shift.id)}
												>
													<div
														className="shift-icon"
														style={{
															backgroundColor: `${shift.color}20`,
															color: shift.color,
														}}
													>
														{/* Puedes poner iconos por code si quieres */}
														{shift.code === "MORNING" && <i className="fa-solid fa-sun" />}
														{shift.code === "EVENING" && <i className="fa-solid fa-cloud-sun" />}
														{shift.code === "REGULAR" && <i className="fa-solid fa-clock" />}
													</div>
													<div className="shift-info">
														<div className="shift-name">{shift.name}</div>
														<div className="shift-time">{shift.timeLabel}</div>
													</div>
												</div>
											))}
										</div>
									</div>
								</div>

								{/* Tipos de turno */}

								{/* Rango de fechas */}
								<div className="form-group">
									<label className="form-label">Rango de Fechas</label>
									<div className="week-range-selector">
										<div className="date-input-group">
											<div className="date-field">
												<label>Fecha de Inicio</label>
												<input
													type="date"
													className="form-input date-input"
													value={weekRange.start}
													onChange={(e) =>
														setWeekRange((p) => ({ ...p, start: e.target.value }))
													}
												/>
											</div>
											<div className="date-separator">
												<i className="fa-solid fa-arrow-right" />
											</div>
											<div className="date-field">
												<label>Fecha de Fin</label>
												<input
													type="date"
													className="form-input date-input"
													value={weekRange.end}
													onChange={(e) => setWeekRange((p) => ({ ...p, end: e.target.value }))}
												/>
											</div>
										</div>

										{weekRange.start && weekRange.end && (
											<div className="range-info">
												<div className="info-badge">
													<i className="fa-solid fa-info-circle" />
													El horario se aplicará a los días del rango (filtrando fines si marcas la
													opción).
												</div>
												<div className="weeks-counter">
													<strong>{getWeeksInRange()}</strong> semanas aproximadamente
												</div>
											</div>
										)}
									</div>
								</div>

								{/* Acciones */}
								<div className="form-actions">
									<button
										className="btn btn-primary"
										onClick={handleAssignShift}
										disabled={submitting}
									>
										<i className="fa-solid fa-check" />
										{submitting ? "Asignando…" : "Asignar Turno"}
									</button>
									<button
										className="btn btn-secondary"
										onClick={() => {
											setSelectedEmployee("");
											setSelectedShiftTypeId("");
											setWeekRange({ start: "", end: "" });
											setExcludeWeekends(false);
											setOverrideExisting(false);
											setNotifyEmployee(true);
											setAdditionalNotes("");
											setIntervalWeeks(1);
										}}
										disabled={submitting}
									>
										<i className="fa-solid fa-times" />
										Cancelar
									</button>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</section>
	);
};
