// src/components/EmployeeTimeLog.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Clock, LogIn, LogOut, Coffee, Edit, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import {
        getPunchStatus,
        startShiftApi,
        pauseToggleApi,
        endShiftApi,
        getSummaryApi,
        getPunchesListApi,
} from "../../services/timePunchAPI";
import "./EmployeeTimeLog.css";

/* ---------- helpers ---------- */
const pad2 = (n) => String(n).padStart(2, "0");

// Crea Date local desde "YYYY-MM-DD"
const dateFromISO = (iso) => {
        const [y, m, d] = iso.split("-").map(Number);
        return new Date(y, (m || 1) - 1, d || 1);
};

const formatTimeHHMM = (iso) => {
        if (!iso) return "--:--";
        const d = new Date(iso);
        return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

const formatHMS = (totalSeconds) => {
        if (totalSeconds == null) return "--";
        const s = Math.max(0, Math.floor(totalSeconds));
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        return `${pad2(h)}:${pad2(m)}:${pad2(sec)}`;
};

const formatHoursMinutes = (totalSeconds) => {
        if (typeof totalSeconds !== "number") return "--";
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
};

const monthRange = (anchorDate) => {
        const y = anchorDate.getFullYear();
        const m = anchorDate.getMonth();
        const from = new Date(y, m, 1);
        const to = new Date(y, m + 1, 0);
        const isoFrom = `${from.getFullYear()}-${pad2(from.getMonth() + 1)}-${pad2(from.getDate())}`;
        const isoTo = `${to.getFullYear()}-${pad2(to.getMonth() + 1)}-${pad2(to.getDate())}`;
        return { from, to, isoFrom, isoTo };
};

const monthLabelES = (dateObj) =>
        new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" })
                .format(dateObj)
                .replace(/^./, (c) => c.toUpperCase());

/* ---------- timeline ---------- */

const BREAK_ALMUERZO_MINUTES = 45;

const buildTimelineFromPunches = (punchesLocalSortedAsc) => {
        // punchesLocalSortedAsc viene ORDENADO ASC por hora local
        const timeline = [];
        let breakStart = null;

        for (const p of punchesLocalSortedAsc) {
                const tLocal = p.punched_at_local;

                if (p.punch_type === "IN") {
                        //  ahora registramos TODAS las entradas
                        timeline.push({
                                type: "entrada",
                                label: "Entrada",
                                time: formatTimeHHMM(tLocal),
                        });
                        // opcional: al entrar, cerramos cualquier break colgado a efectos visuales
                        breakStart = null;

                } else if (p.punch_type === "BREAK_START") {
                        if (!breakStart) breakStart = tLocal;

                } else if (p.punch_type === "BREAK_END") {
                        if (breakStart) {
                                const start = new Date(breakStart);
                                const end = new Date(tLocal);
                                const mins = Math.max(0, Math.round((end - start) / 60000));
                                const etiqueta = mins >= BREAK_ALMUERZO_MINUTES ? "almuerzo" : "pausa";
                                timeline.push({
                                        type: etiqueta,
                                        label: etiqueta === "almuerzo" ? "Almuerzo" : "Pausa",
                                        time: `${formatTimeHHMM(breakStart)} - ${formatTimeHHMM(tLocal)}`,
                                        minutes: mins,
                                });
                                breakStart = null;
                        }

                } else if (p.punch_type === "OUT") {
                        timeline.push({
                                type: "salida",
                                label: "Salida",
                                time: formatTimeHHMM(tLocal),
                        });
                        // si hubiera una pausa abierta, la damos por cerrada a efectos visuales
                        breakStart = null;
                }
        }

        // Si quedó una pausa abierta, la mostramos como “en curso”
        if (breakStart) {
                timeline.push({
                        type: "pausa",
                        label: "Pausa (en curso)",
                        time: `${formatTimeHHMM(breakStart)} - —`,
                });
        }

        // Devolvemos DESC: últimos eventos arriba (la UI ya está preparada para esto)
        return timeline.reverse();
};


/* ---------- cálculo del tiempo trabajado HOY (en vivo) ---------- */
const computeWorkSecondsToday = (punchesLocalSortedAsc, now = new Date()) => {
        // Recorremos punches crudos y sumamos sesiones netas (desc. pausas).
        let workSec = 0;
        let currentIn = null;
        let breakStart = null;
        let breakAcc = 0;

        for (const p of punchesLocalSortedAsc) {
                const t = new Date(p.punched_at_local);
                if (p.punch_type === "IN") {
                        currentIn = t;
                        breakStart = null;
                        breakAcc = 0;
                } else if (p.punch_type === "BREAK_START") {
                        if (currentIn && !breakStart) breakStart = t;
                } else if (p.punch_type === "BREAK_END") {
                        if (currentIn && breakStart) {
                                if (t > breakStart) breakAcc += (t - breakStart) / 1000;
                                breakStart = null;
                        }
                } else if (p.punch_type === "OUT") {
                        if (currentIn) {
                                if (breakStart && t > breakStart) {
                                        breakAcc += (t - breakStart) / 1000;
                                        breakStart = null;
                                }
                                const gross = (t - currentIn) / 1000;
                                workSec += Math.max(0, gross - breakAcc);
                                currentIn = null;
                                breakAcc = 0;
                        }
                }
        }

        // Si hay sesión abierta, sumar desde el último IN hasta ahora, descontando pausa en curso
        if (currentIn) {
                let extraBreak = 0;
                if (breakStart && now > breakStart) {
                        extraBreak = (now - breakStart) / 1000;
                }
                const gross = (now - currentIn) / 1000;
                workSec += Math.max(0, gross - (breakAcc + extraBreak));
        }

        return Math.max(0, Math.floor(workSec));
};

/* ---------- filas: una por sesión completada ---------- */
const buildRowsFromSessionsNoGroup = (sessions) => {
        // sessions: [{date, in, out, net_seconds, break_seconds, ...}]
        // Una fila por sesión
        return [...(sessions || [])]
                .sort((a, b) => new Date(b.in) - new Date(a.in))
                .map((s) => {
                        const isToday =
                                s.date === `${new Date().getFullYear()}-${pad2(new Date().getMonth() + 1)}-${pad2(new Date().getDate())}`;
                        return {
                                key: `${s.date}-${s.in}-${s.out || ""}`,
                                dateLabel: new Intl.DateTimeFormat("es-ES", { weekday: "short", day: "2-digit" }).format(dateFromISO(s.date)),
                                entrada: formatTimeHHMM(s.in),
                                salida: formatTimeHHMM(s.out),
                                pausas: formatHoursMinutes(s.break_seconds),
                                horas: formatHoursMinutes(s.net_seconds),
                                extra: "--",
                                estado: "completado",
                                isToday,
                        };
                });
};

export const EmployeeTimeLog = () => {
        const { token, logout } = useAuth();

        const [status, setStatus] = useState({ open: false, paused: false, last_type: null, last_at: null });
        const [loadingAction, setLoadingAction] = useState(null);
        const [currentMonthDate, setCurrentMonthDate] = useState(() => {
                const now = new Date();
                return new Date(now.getFullYear(), now.getMonth(), 1);
        });
        const [summary, setSummary] = useState(null);
        const [rows, setRows] = useState([]);
        const [timelineEvents, setTimelineEvents] = useState([]);
        const [todayPunchesRaw, setTodayPunchesRaw] = useState([]); //  crudos para el contador
        const [todayWorkSeconds, setTodayWorkSeconds] = useState(0);
        const [error, setError] = useState(null);

        const { isoFrom, isoTo } = useMemo(() => monthRange(currentMonthDate), [currentMonthDate]);

        /* --- loaders --- */
        const loadStatus = async () => {
                try {
                        const data = await getPunchStatus(token);
                        setStatus(data);
                } catch (err) {
                        if (String(err?.message || "").includes("401")) logout();
                        else setError(err.message);
                }
        };

        const loadSummary = async () => {
                try {
                        const data = await getSummaryApi(token, isoFrom, isoTo, "Europe/Madrid");
                        setSummary(data);
                } catch (err) {
                        setError(err.message);
                }
        };

        const loadTodayPunches = async () => {
                try {
                        const now = new Date();
                        const todayIso = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
                        const listData = await getPunchesListApi(token, todayIso, todayIso, "Europe/Madrid");
                        const punches = (listData.punches || []).sort(
                                (a, b) => new Date(a.punched_at_local) - new Date(b.punched_at_local)
                        );
                        setTodayPunchesRaw(punches);
                        setTimelineEvents(buildTimelineFromPunches(punches));
                        setTodayWorkSeconds(computeWorkSecondsToday(punches, new Date()));
                } catch (err) {
                        setError(err.message);
                }
        };

        /* --- efectos de carga --- */
        useEffect(() => {
                if (!token) return;
                (async () => {
                        await loadStatus();
                        await loadSummary();
                        await loadTodayPunches();
                })();
                // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [token, isoFrom, isoTo]);

        /* --- refresco periódico del estado/timeline si turno abierto --- */
        useEffect(() => {
                if (!token || !status.open) return;
                const id = setInterval(async () => {
                        await loadStatus();
                        await loadTodayPunches();
                }, 60000);
                return () => clearInterval(id);
                // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [token, status.open]);

        /* --- contador en vivo HH:MM:SS (cada segundo) --- */
        useEffect(() => {
                // recalcula cada segundo en cliente usando los punches crudos de hoy
                const tick = () => setTodayWorkSeconds(computeWorkSecondsToday(todayPunchesRaw, new Date()));
                tick();
                const id = setInterval(tick, 1000);
                return () => clearInterval(id);
        }, [todayPunchesRaw]);

        /* --- recalcular filas (una por sesión cerrada) --- */
        useEffect(() => {
                if (!summary) {
                        setRows([]);
                        return;
                }
                setRows(buildRowsFromSessionsNoGroup(summary.sessions));
        }, [summary]);

        /* --- handlers --- */
        const handleStart = async () => {
                if (!token || status.open || loadingAction) return;
                setError(null);
                setLoadingAction("start");
                try {
                        await startShiftApi(token);
                        await loadStatus();
                        await loadSummary();     // por si cerraste una sesión justo antes
                        await loadTodayPunches();
                } catch (err) {
                        setError(err.message);
                } finally {
                        setLoadingAction(null);
                }
        };

        const handlePauseToggle = async () => {
                if (!token || !status.open || loadingAction) return;
                setError(null);
                setLoadingAction("pause");
                try {
                        await pauseToggleApi(token);
                        await loadStatus();
                        await loadTodayPunches();
                } catch (err) {
                        setError(err.message);
                } finally {
                        setLoadingAction(null);
                }
        };

        const handleEnd = async () => {
                if (!token || !status.open || loadingAction) return;
                setError(null);
                setLoadingAction("end");
                try {
                        await endShiftApi(token);
                        await loadStatus();
                        await loadSummary();     // añade una nueva fila de sesión completada
                        await loadTodayPunches();
                } catch (err) {
                        setError(err.message);
                } finally {
                        setLoadingAction(null);
                }
        };

        const handlePrevMonth = () =>
                setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
        const handleNextMonth = () =>
                setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

        const monthLabel = monthLabelES(currentMonthDate);

        return (
                <div className="timelog-container">
                        {/* Header */}
                        <div className="timelog-header">
                                <div className="header-left">
                                        <h1>Registro de Horarios</h1>
                                        <p>Controla y registra tus horas de trabajo diarias.</p>
                                </div>
                                <div className="header-right">
                                        <span className="month-selector">{monthLabel}</span>
                                        <button
                                                className="clock-in-btn"
                                                onClick={handleStart}
                                                disabled={loadingAction !== null || status.open}
                                                aria-busy={loadingAction === "start"}
                                                title={status.open ? "Ya hay un turno abierto" : "Fichar entrada"}
                                        >
                                                <Clock size={16} />
                                                {loadingAction === "start" ? "Fichando..." : "Fichar Entrada"}
                                        </button>
                                </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="quick-actions">
                                <div className="action-card" onClick={handleStart} aria-disabled={status.open || loadingAction !== null}>
                                        <div className="action-icon green">
                                                <LogIn size={20} />
                                        </div>
                                        <div className="action-content">
                                                <h3>Fichar Entrada</h3>
                                                <p>Registra tu hora de entrada</p>
                                        </div>
                                </div>

                                <div className="action-card" onClick={handleEnd} aria-disabled={!status.open || loadingAction !== null}>
                                        <div className="action-icon red">
                                                <LogOut size={20} />
                                        </div>
                                        <div className="action-content">
                                                <h3>Fichar Salida</h3>
                                                <p>Registra tu hora de salida</p>
                                        </div>
                                </div>

                                <div className="action-card" onClick={handlePauseToggle} aria-disabled={!status.open || loadingAction !== null}>
                                        <div className="action-icon yellow">
                                                <Coffee size={20} />
                                        </div>
                                        <div className="action-content">
                                                <h3>{status.paused ? "Reanudar" : "Iniciar Pausa"}</h3>
                                                <p>{status.paused ? "Continuar turno" : "Pausa para descanso"}</p>
                                        </div>
                                </div>

                                <div className="action-card" aria-disabled>
                                        <div className="action-icon blue">
                                                <Edit size={20} />
                                        </div>
                                        <div className="action-content">
                                                <h3>Entrada Manual</h3>
                                                <p>Próximamente</p>
                                        </div>
                                </div>
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

                                <div className="session-card">
                                        <div className="session-header">
                                                <h3>Cronología del día</h3>
                                        </div>

                                        {/* contenedor con scroll; los eventos están en orden DESC (más recientes arriba) */}
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

                        {/* Daily Log Table (una fila por sesión completada) */}
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
        );
};