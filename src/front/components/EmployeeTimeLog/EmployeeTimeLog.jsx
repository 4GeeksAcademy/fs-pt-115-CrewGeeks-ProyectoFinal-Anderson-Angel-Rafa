import React from "react";
import { Clock, LogIn, LogOut, Coffee, Edit, ChevronLeft, ChevronRight } from "lucide-react";
import { useTimePunch, formatHMS, formatTimeHHMM, monthLabelES } from "../../hooks/useTimePunch";
import "./EmployeeTimeLog.css";

export const EmployeeTimeLog = () => {
	const {
		status,
		loadingAction,
		currentMonthDate,
		rows,
		timelineEvents,
		todayWorkSeconds,
		error,
		handleStart,
		handlePauseToggle,
		handleEnd,
		handlePrevMonth,
		handleNextMonth,
	} = useTimePunch();

	return (
		<section className="content-area">
			{/* Header */}
			<div className="content-header">
				<div className="content-title">Registro de Horarios</div>
				<div className="content-subtitle">Controla y registra tus horas de trabajo diarias.</div>
			</div>

			{/* Quick Actions */}
			<div className="content-body">
				<div className="cg-actions-grid">
					<button className="cg-action" type="button" onClick={handleStart} aria-disabled={status.open || loadingAction !== null}>
						<span className="cg-aicon cg-aicon--start" aria-hidden="true">
							<LogIn size={20} />
						</span>
						<span className="cg-action__label">
							<h3>Fichar Entrada</h3>
							<p>Registra tu hora de entrada</p>
						</span>
					</button>

					<button className="cg-action" type="button" onClick={handleEnd} aria-disabled={!status.open || loadingAction !== null}>
						<span className="cg-aicon cg-aicon--stop" aria-hidden="true">
							<LogOut size={20} />
						</span>
						<span className="cg-action__label">
							<h3>Fichar Salida</h3>
							<p>Registra tu hora de salida</p>
						</span>
					</button>

					<button className="cg-action" type="button" onClick={handlePauseToggle} aria-disabled={!status.open || loadingAction !== null}>
						<span className="cg-aicon cg-aicon--pause">
							<Coffee size={20} />
						</span>
						<span className="cg-action__label">
							<h3>{status.paused ? "Reanudar" : "Iniciar Pausa"}</h3>
							<p>{status.paused ? "Continuar turno" : "Pausa para descanso"}</p>
						</span>
					</button>

					<button className="cg-action" type="button" aria-disabled>
						<span className="cg-aicon--edit">
							<Edit size={20} />
						</span>
						<div className="action-content">
							<h3>Entrada Manual</h3>
							<p>Próximamente</p>
						</div>
					</button>
				</div>

				{/* Current Session */}
				<div className="current-session">
					<div className="session-card">
						<div className="session-header">
							<Clock size={20} />
							<h3>Estado Actual</h3>
						</div>

						<div className="status-indicator">
							<div
								className="status-dot"
								style={{ background: status.open ? (status.paused ? "#facc15" : "#22c55e") : "#ef4444" }}
							/>
							<span>{status.open ? (status.paused ? "En pausa" : "En horario laboral") : "Fuera de horario"}</span>
						</div>

						<div className="session-details">
							<div className="detail-row">
								<span className="detail-label">Jornada de hoy</span>
								<span className="detail-value highlight">{formatHMS(todayWorkSeconds)}</span>
							</div>
							<div className="detail-row">
								<span className="detail-label">Último evento</span>
								<span className="detail-value">
									{status.last_type ? `${status.last_type} — ${formatTimeHHMM(status.last_at)}` : "—"}
								</span>
							</div>
							<div className="detail-row">
								<span className="detail-label">Entrada de hoy</span>
								<span className="detail-value">{timelineEvents.find((e) => e.type === "entrada")?.time || "—"}</span>
							</div>
							<div className="detail-row">
								<span className="detail-label">Salida de hoy</span>
								<span className="detail-value">
									{([...timelineEvents].find((e) => e.type === "salida") || {}).time || "—"}
								</span>
							</div>
						</div>
					</div>

					{/* Cronología del día */}
					<div className="session-card">
						<div className="session-header">
							<h3>Cronología del día</h3>
						</div>

						<div className="timeline-list scrollable">
							{timelineEvents.length === 0 ? (
								<div className="timeline-item">
									<div className="timeline-icon entrada">•</div>
									<div className="timeline-content">
										<div className="timeline-type">Sin eventos hoy</div>
										<div className="timeline-time">—</div>
									</div>
								</div>
							) : (
								timelineEvents.map((ev, i) => (
									<div key={`${ev.type}-${i}`} className="timeline-item">
										<div className={`timeline-icon ${ev.type}`}>
											{ev.type === "entrada" ? "E" : ev.type === "salida" ? "S" : ev.type === "almuerzo" ? "A" : "P"}
										</div>
										<div className="timeline-content">
											<div className="timeline-type">{ev.label}</div>
											<div className="timeline-time">{ev.time}</div>
										</div>
									</div>
								))
							)}
						</div>
					</div>
				</div>

				{/* Daily Log Table */}
				<div className="daily-log">
					<div className="log-header">
						<h3>Registro Diario — {monthLabelES(currentMonthDate)}</h3>
						<div className="month-nav">
							<button className="nav-btn" onClick={handlePrevMonth} aria-label="Mes anterior">
								<ChevronLeft size={16} />
							</button>
							<span className="current-month">{monthLabelES(currentMonthDate)}</span>
							<button className="nav-btn" onClick={handleNextMonth} aria-label="Mes siguiente">
								<ChevronRight size={16} />
							</button>
						</div>
					</div>

					<table className="log-table">
						<thead>
							<tr>
								<th>Fecha</th>
								<th>Entrada</th>
								<th>Salida</th>
								<th>Pausas</th>
								<th>Horas Totales</th>
								<th>Extra</th>
								<th>Estado</th>
							</tr>
						</thead>
						<tbody>
							{rows.length === 0 ? (
								<tr>
									<td colSpan={7} style={{ textAlign: "center", padding: 16, opacity: 0.7 }}>
										Aún no hay registros de este mes
									</td>
								</tr>
							) : (
								rows.map((r) => (
									<tr key={r.key}>
										<td className="date-cell">
											{r.dateLabel}
											{r.isToday && <span className="day-label">Hoy</span>}
										</td>
										<td className="time-cell">{r.entrada}</td>
										<td className="time-cell">{r.salida}</td>
										<td className="time-cell">{r.pausas}</td>
										<td className="hours-cell">{r.horas}</td>
										<td className={`overtime-cell ${String(r.extra).startsWith("-") ? "negative" : ""}`}>{r.extra}</td>
										<td>
											<span className={`status-badge ${r.estado}`}>
												{r.estado === "activo" ? "Activo" : r.estado === "fin-semana" ? "Fin de semana" : "Completado"}
											</span>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				{error && (
					<div className="error-toast" role="alert" aria-live="assertive">
						{error}
					</div>
				)}
			</div>
		</section>
	);
};

