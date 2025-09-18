import React, { useEffect, useMemo, useState } from "react";
import {
	ChevronLeft, ChevronRight,
	Clock, Calendar
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import {
	getShiftTypes,
	listShifts,
} from "../../services/shiftsAPI";
import "./EmployeeShifts.css";

export const EmployeeShifts = () => {

	const { token } = useAuth();

	// --- estado base ---
	const [monthDate, setMonthDate] = useState(() => {
		const d = new Date();
		return new Date(d.getFullYear(), d.getMonth(), 1);
	});
	const [types, setTypes] = useState([]);            // [{ id, code, name, color_hex, ... }]
	const [items, setItems] = useState([]);            // turnos (expresos + generados)
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	// --- helpers de fechas ---
	const MONTHS_ES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
	const WEEKDAYS_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

	const fmtYearMonth = (d) => `${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`;
	const pad2 = (n) => String(n).padStart(2, "0");
	const toISO = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

	const monthBounds = useMemo(() => {
		const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
		const last = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
		return { first, last, fromISO: toISO(first), toISO: toISO(last) };
	}, [monthDate]);

	// para cuadrícula Lunes-Domingo
	const mondayIndex = (jsDay) => (jsDay + 6) % 7; // JS: 0=Dom..6=Sáb -> 0=Lun..6=Dom

	// --- carga de datos ---
	useEffect(() => {
		if (!token) return;
		let cancel = false;
		(async () => {
			try {
				setLoading(true);
				setError(null);
				const [tList, shifts] = await Promise.all([
					getShiftTypes(token),
					listShifts({ from: monthBounds.fromISO, to: monthBounds.toISO, token }),
				]);
				if (cancel) return;
				setTypes(tList || []);
				setItems(shifts || []);
			} catch (e) {
				if (!cancel) setError(e.message || "Error cargando turnos");
			} finally {
				if (!cancel) setLoading(false);
			}
		})();
		return () => { cancel = true; };
	}, [token, monthBounds.fromISO, monthBounds.toISO]);

	// --- agrupación por día ---
	const byDate = useMemo(() => {
		const map = new Map(); // dateISO -> array de turnos
		for (const it of items) {
			const k = it.date;
			if (!map.has(k)) map.set(k, []);
			map.get(k).push(it);
		}
		// orden por hora de inicio
		for (const arr of map.values()) {
			arr.sort((a, b) => a.start_time.localeCompare(b.start_time));
		}
		return map;
	}, [items]);

	// --- leyenda desde tipos ---
	const legend = useMemo(() => {
		// muestra tipos globales y/o de empresa que existan
		return types.map(t => ({
			id: t.id,
			name: t.name,
			code: t.code,
			color: t.color_hex,
		}));
	}, [types]);

	// --- grid de calendario ---
	const calendarCells = useMemo(() => {
		const cells = [];
		const first = monthBounds.first;
		const last = monthBounds.last;

		const lead = mondayIndex(first.getDay()); // nº de celdas vacías al principio
		for (let i = 0; i < lead; i++) cells.push({ type: "empty", key: `e-${i}` });

		for (let day = 1; day <= last.getDate(); day++) {
			const d = new Date(first.getFullYear(), first.getMonth(), day);
			const iso = toISO(d);
			const dayShifts = byDate.get(iso) || [];
			cells.push({
				type: "day",
				key: `d-${iso}`,
				dateISO: iso,
				dayNum: day,
				shifts: dayShifts,
			});
		}
		// (opcional) rellenar trailing vacíos para semanas completas
		const total = cells.length;
		const rem = total % 7;
		if (rem !== 0) {
			const add = 7 - rem;
			for (let i = 0; i < add; i++) cells.push({ type: "empty", key: `t-${i}` });
		}
		return cells;
	}, [monthBounds.first, monthBounds.last, byDate]);

	// --- próximos turnos (desde hoy) ---
	const upcoming = useMemo(() => {
		const todayISO = toISO(new Date());
		const future = items
			.filter(x => x.date >= todayISO)
			.slice(0) // copia
			.sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time));
		return future.slice(0, 8); // muestra hasta 8
	}, [items]);

	// --- navegación de mes ---
	const moveMonth = (delta) => {
		const y = monthDate.getFullYear();
		const m = monthDate.getMonth();
		setMonthDate(new Date(y, m + delta, 1));
	};

	// --- Helpers UI ---
	const typeFor = (shift) => shift?.type || null; // el backend ya embebe el type serializado
	const chipStyle = (shift) => {
		const t = typeFor(shift);
		return t?.color_hex ? { backgroundColor: t.color_hex } : {};
		// si prefieres borde y texto oscuros:
		// return t?.color_hex ? { borderColor: t.color_hex, color: t.color_hex } : {};
	};

	// --- render ---
	return (
		<div className="shifts-container">
			{/* Header */}
			<div className="shifts-header">
				<div className="shifts-title">
					<div className="content-title">Mis Horarios</div>
					<p>Consulta tus horarios de trabajo del mes.</p>
				</div>
				<div className="month-selector">
					<button className="nav-btn" onClick={() => moveMonth(-1)}>
						<ChevronLeft size={16} />
					</button>
					<span>{fmtYearMonth(monthDate)}</span>
					<button className="nav-btn" onClick={() => moveMonth(1)}>
						<ChevronRight size={16} />
					</button>
				</div>
			</div>

			{/* Estado de carga / error */}
			{loading && (
				<div className="loading-row">Cargando horarios…</div>
			)}
			{error && (
				<div className="error-row">Error: {error}</div>
			)}
			{!token && (
				<div className="error-row">Inicia sesión para ver tus horarios.</div>
			)}

			{/* Calendar */}
			<div className="calendar-section">
				<div className="calendar-header">
					<Calendar size={20} />
					<h2>Calendario programado</h2>
				</div>

				<div className="calendar-grid">
					{WEEKDAYS_ES.map((d) => (
						<div className="calendar-day-header" key={d}>{d}</div>
					))}

					{calendarCells.map((cell) => {
						if (cell.type === "empty") {
							return <div className="calendar-day empty" key={cell.key} />;
						}
						return (
							<div className="calendar-day" key={cell.key}>
								<div className="day-number">{cell.dayNum}</div>
								{cell.shifts.map((sh, idx) => (
									<div
										key={idx}
										className={`shift-block${sh.generated ? " generated" : ""}`}
										title={`${(typeFor(sh)?.name || "Turno")} · ${sh.start_time}-${sh.end_time}`}
										style={chipStyle(sh)}
									>
										{sh.start_time}-{sh.end_time}
									</div>
								))}
							</div>
						);
					})}
				</div>

				{/* Leyenda dinámica por tipos */}
				<div className="calendar-legend">
					{legend.map((l) => (
						<div className="legend-item" key={l.id}>
							<div className="legend-dot" style={{ backgroundColor: l.color }} />
							<span>{l.name}</span>
						</div>
					))}
				</div>
			</div>

			{/* Próximos turnos */}
			<div className="bottom-section">
				<div className="upcoming-shifts">
					<div className="section-header">
						<Clock size={20} />
						<h3>Próximos turnos</h3>
					</div>
					<div className="shifts-list">
						{upcoming.length === 0 && (
							<div className="empty-hint">No hay turnos próximos en el rango.</div>
						)}
						{upcoming.map((s, i) => (
							<div className="shift-item" key={`${s.date}-${s.start_time}-${i}`}>
								<div className="shift-info">
									<h4>
										{new Date(s.date).toLocaleDateString("es-ES", {
											weekday: "short",
											day: "2-digit",
											month: "short",
										}).replace(/\.$/, "")}
									</h4>
									<p>{s.start_time} - {s.end_time}</p>
								</div>
								<span className="shift-status" style={chipStyle(s)}>
									{typeFor(s)?.name || "Turno"}
								</span>
							</div>
						))}
					</div>
				</div>

				{/* Puedes añadir aquí tus "Notas y recordatorios" cuando tengas fuente real */}
				{/* <div className="notes-reminders">...</div> */}
			</div>
		</div>
	);
};
 