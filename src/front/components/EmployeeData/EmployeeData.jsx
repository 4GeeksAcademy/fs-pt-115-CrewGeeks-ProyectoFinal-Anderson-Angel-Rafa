import "./EmployeeData.css";
import { Link } from "react-router-dom";
import { useTimePunch, formatHMS, formatTimeHHMM } from "../../hooks/useTimePunch";
import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { getSummaryApi, getPunchesListApi } from "../../services/timePunchAPI";
import { getMyHolidayBalance } from "../../services/holidaysAPI";
import { pad2 } from "../../hooks/useTimePunch";

export const EmployeeData = () => {
    const {
        status,
        todayWorkSeconds,
        handleStart,
        handlePauseToggle,
        handleEnd,
        loadingAction,
    } = useTimePunch();

    // === KPIs dinámicos (sin tocar tu layout) ===
    const { token } = useAuth();
    const [kpiDaysWorked, setKpiDaysWorked] = useState(null);
    const [kpiTotalHoursHuman, setKpiTotalHoursHuman] = useState(null);
    const [kpiVacRemaining, setKpiVacRemaining] = useState(null);
    const [kpiLoading, setKpiLoading] = useState(false);
    const [kpiError, setKpiError] = useState(null);

    // Rango: 1 → hoy del mes actual
    const nowKpi = new Date();
    const fromIso = `${nowKpi.getFullYear()}-${pad2(nowKpi.getMonth() + 1)}-01`;
    const toIso = `${nowKpi.getFullYear()}-${pad2(nowKpi.getMonth() + 1)}-${pad2(nowKpi.getDate())}`;

    // Helpers fallback si el summary devuelve 0h
    const toDate = (v) => (v ? new Date(v) : null);
    const fmtHumanFromSeconds = (secs) => {
        const total = Math.max(0, Math.floor(secs || 0));
        const h = Math.floor(total / 3600);
        const m = Math.floor((total % 3600) / 60);
        return `${h}h ${m}m`;
    };
    const computeWorkedSeconds = (punches = []) => {
        const sorted = [...punches].sort((a, b) =>
            String(a.punched_at_local).localeCompare(String(b.punched_at_local))
        );
        let totalMs = 0;
        let lastIn = null;

        for (const p of sorted) {
            const t = toDate(p.punched_at_local);
            if (!t) continue;
            const type = String(p.punch_type || "").toUpperCase();
            if (type === "IN") lastIn = t;
            else if (type === "OUT" && lastIn) {
                const start = lastIn.getTime();
                const end = t.getTime();
                if (end > start) totalMs += (end - start);
                lastIn = null;
            }
        }
        return Math.max(0, Math.floor(totalMs / 1000));
    };

    useEffect(() => {
        let alive = true;

        const toDate = (v) => (v ? new Date(v) : null);
        const fmtHumanFromSeconds = (secs) => {
            const total = Math.max(0, Math.floor(secs || 0));
            const h = Math.floor(total / 3600);
            const m = Math.floor((total % 3600) / 60);
            return `${h}h ${m}m`;
        };
        const computeWorkedSeconds = (punches = []) => {
            const sorted = [...punches].sort((a, b) =>
                String(a.punched_at_local).localeCompare(String(b.punched_at_local))
            );
            let totalMs = 0;
            let lastIn = null;

            for (const p of sorted) {
                const t = toDate(p.punched_at_local);
                if (!t) continue;
                const type = String(p.punch_type || "").toUpperCase();
                if (type === "IN") {
                    lastIn = t;
                } else if (type === "OUT" && lastIn) {
                    const start = lastIn.getTime();
                    const end = t.getTime();
                    if (end > start) totalMs += (end - start);
                    lastIn = null;
                }
            }
            return Math.max(0, Math.floor(totalMs / 1000));
        };

        (async () => {
            try {
                setKpiLoading(true);
                setKpiError(null);

                const summary = await getSummaryApi(token, fromIso, toIso, "Europe/Madrid");
                let human =
                    summary?.human_total ||
                    (summary?.total_hours != null ? `${summary.total_hours}h` : null);

                const list = await getPunchesListApi(token, fromIso, toIso, "Europe/Madrid");
                const punches = Array.isArray(list?.punches) ? list.punches : [];

                const uniqueDays = new Set(
                    punches
                        .map((p) => String(p.punched_at_local || "").slice(0, 10))
                        .filter(Boolean)
                ).size;

                if ((!human || /^0+h\s*0+m?$/i.test(String(human))) && punches.length > 0) {
                    const seconds = computeWorkedSeconds(punches);
                    if (seconds > 0) human = fmtHumanFromSeconds(seconds);
                }

                if (!alive) return;
                setKpiDaysWorked(uniqueDays);
                setKpiTotalHoursHuman(human);


                const balance = await getMyHolidayBalance(token, { year: nowKpi.getFullYear() });
                if (!alive) return;
                setKpiVacRemaining(
                    balance?.remaining_days ??
                    (balance?.allocated_days != null && balance?.used_days != null
                        ? balance.allocated_days - balance.used_days
                        : null)
                );
            } catch (error) {
                if (alive) setKpiError(error?.message || "Error al cargar KPIs");
            } finally {
                if (alive) setKpiLoading(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, [token, fromIso, toIso]);



    return (
        <section className='content-area'>
            <div className='content-header'>
                <div className='content-title'>Dashboard</div>
                <div className='content-subtitle'>
                    Bienvenido de vuelta, aqui tienes tu resumen del dia
                </div>
            </div>
            <div className='content-body'>
                <div className="cg-actions-grid">
                    <button className="cg-action" type="button" aria-label="Iniciar jornada"
                        onClick={handleStart} aria-disabled={status.open || loadingAction !== null}>
                        <span className="cg-aicon cg-aicon--start" aria-hidden="true">
                            <i className="fa-solid fa-play" style={{ color: "#16a34a" }}></i>
                        </span>
                        <span className="cg-action__label">Iniciar jornada</span>
                    </button>

                    <button className="cg-action" type="button" aria-label="Pausa o descanso"
                        onClick={handlePauseToggle} aria-disabled={!status.open || loadingAction !== null}>
                        <span className="cg-aicon cg-aicon--pause" aria-hidden="true">
                            <i className="fa-solid fa-pause" style={{ color: "#ca8a04" }}></i>
                        </span>
                        <span className="cg-action__label">
                            {status.paused ? "Reanudar" : "Pausa / Descanso"}
                        </span>
                    </button>

                    <button className="cg-action" type="button" aria-label="Finalizar jornada"
                        onClick={handleEnd} aria-disabled={!status.open || loadingAction !== null}>
                        <span className="cg-aicon cg-aicon--stop" aria-hidden="true">
                            <i className="fa-solid fa-stop" style={{ color: "#dc2626" }}></i>
                        </span>
                        <span className="cg-action__label">Finalizar jornada</span>
                    </button>
                    <Link to="/holidays" className="cg-action">
                        <span className="cg-aicon cg-aicon--leave" aria-hidden="true">
                            <i className="fa-solid fa-file-export" style={{ color: "#4f46e5" }}></i>
                        </span>
                        <span className="cg-action__label">Solicitar permiso</span>
                    </Link>
                </div>

                <div className="cg-kpis-grid">
                    <article className="cg-kpi">
                        <div className="cg-kpi-head">
                            <div className="cg-kpi-icon" aria-hidden="true"><i className="fa-solid fa-clock" style={{ color: "#3b82f6" }}></i></div>
                            <h3 className="cg-kpi-title">Jornada de hoy</h3>
                        </div>
                        <div className="cg-kpi-value"><strong>{formatHMS(todayWorkSeconds)}</strong></div>
                        <div className="cg-chip">
                            Último evento: {status.last_type ? `${status.last_type} — ${formatTimeHHMM(status.last_at)}` : "—"}
                        </div>
                    </article>
                    <article className="cg-kpi ">
                        <div className="cg-kpi-head">
                            <div className="cg-kpi-icon" aria-hidden="true"><i className="fa-solid fa-calendar" style={{ color: "#3b82f6" }}></i></div>
                            <h3 className="cg-kpi-title">Días trabajados</h3>
                        </div>
                        <div>
                            <div className="cg-kpi-value"><strong>{kpiLoading ? "…" : (kpiDaysWorked ?? "—")}</strong></div>
                        </div>
                        <div className="cg-chip cg-chip--up">
                            +2 vs mes anterior
                        </div>
                    </article>

                    <article className="cg-kpi">
                        <div className="cg-kpi-head">
                            <div className="cg-kpi-icon" aria-hidden="true"><i className="fa-solid fa-hourglass-half" style={{ color: "#3b82f6" }}></i></div>
                            <h3 className="cg-kpi-title">Horas totales</h3>
                        </div>
                        <div className="cg-kpi-value"><strong>{kpiLoading ? "…" : (kpiTotalHoursHuman ?? "—")}</strong></div>
                        <div className="cg-chip cg-chip--up">
                            +8h vs objetivo
                        </div>
                    </article>



                    <article className="cg-kpi">
                        <div className="cg-kpi-head">
                            <div className="cg-kpi-icon" aria-hidden="true"><i className="fa-solid fa-umbrella-beach" style={{ color: "#3b82f6" }}></i></div>
                            <h3 className="cg-kpi-title">Vacaciones restantes</h3>
                        </div>
                        <div className="cg-kpi-value"><strong>{kpiLoading ? "…" : (kpiVacRemaining ?? "—")}</strong></div>
                        <div className="cg-chip cg-chip--down">
                            -3 usados
                        </div>
                    </article>
                </div>

                {/* Actividad reciente */}
                <div className='activity-section'>
                    <div className='section-header'>
                        <div className='section-title'>Actividad reciente</div>
                        <a href='#' className='section-action'>Ver todo →</a>
                    </div>

                    <div className='activity-list'>
                        <div className='activity-item'>
                            <div className='activity-icon success'><i className="fa-solid fa-check" style={{ color: "#10b981" }}></i></div>
                            <div className='activity-content'>
                                <div className='activity-title'>Jornada iniciada correctamente</div>
                                <div className='activity-desc'>Has fichado a las 09:00 AM</div>
                            </div>
                            <div className='activity-time'>Hace 2h</div>
                        </div>

                        <div className='activity-item'>
                            <div className='activity-icon info'><i className="fa-solid fa-file-invoice" style={{ color: "#3b82f6" }}></i></div>
                            <div className='activity-content'>
                                <div className='activity-title'>Nomina de Julio disponible</div>
                                <div className='activity-desc'>Ya puedes descargar tu nomina del mes</div>
                            </div>
                            <div className='activity-time'>Ayer</div>
                        </div>

                        <div className='activity-item'>
                            <div className='activity-icon warning'><i className="fa-solid fa-triangle-exclamation" style={{ color: "#fbbf24" }}></i></div>
                            <div className='activity-content'>
                                <div className='activity-title'>Solicitud pendiente de aprobacion</div>
                                <div className='activity-desc'>
                                    tu solicitud de vacaciones esta en revision
                                </div>
                            </div>
                            <div className='activity-time'>HAce 3 dias</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
















