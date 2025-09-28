import React, { useEffect, useMemo, useState } from "react";
import "./AdminShiftAssignment.css";

import { getAllEmployees } from "../../services/employeesAPI";
import {
  getShiftTypes,
  createSeries,
  listShifts,
  createShift,
  deleteShift,
  upsertSeriesException,
  monthRange,
} from "../../services/shiftsAPI";

const DEFAULT_HOURS_BY_CODE = {
  MORNING: { start_time: "06:00", end_time: "14:00" },
  EVENING: { start_time: "09:00", end_time: "17:00" },
  REGULAR: { start_time: "14:00", end_time: "22:00" },
};

const pad2 = (n) => String(n).padStart(2, "0");
const toISO = (d) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
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

export const AdminShiftAssignment = () => {
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedShiftTypeId, setSelectedShiftTypeId] = useState("");
  const [weekRange, setWeekRange] = useState({ start: "", end: "" });
  const [excludeWeekends, setExcludeWeekends] = useState(true);
  const [overrideExisting, setOverrideExisting] = useState(false); // crear expresos
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [intervalWeeks, setIntervalWeeks] = useState(1);

  const [employees, setEmployees] = useState([]);
  const [shiftTypes, setShiftTypes] = useState([]);
  const [recentShifts, setRecentShifts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingRange, setDeletingRange] = useState(false);
  const [error, setError] = useState(null);

  // Carga inicial
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [emps, types] = await Promise.all([
          getAllEmployees(),
          getShiftTypes(),
        ]);
        if (!mounted) return;
        setEmployees(emps || []);
        setShiftTypes((types || []).filter((t) => t.code !== "HOLIDAY"));
        const { from, to } = monthRange();
        setWeekRange({ start: from, end: to });
      } catch (e) {
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

  // Refrescar lista al cambiar filtros
  useEffect(() => {
    const refresh = async () => {
      if (!selectedEmployee || !weekRange.start || !weekRange.end) {
        setRecentShifts([]);
        return;
      }
      try {
        const shifts = await listShifts({
          from: weekRange.start,
          to: weekRange.end,
          employeeId: Number(selectedEmployee),
        });
        setRecentShifts(shifts || []);
      } catch {
        setRecentShifts([]);
      }
    };
    refresh();
  }, [selectedEmployee, weekRange.start, weekRange.end]);

  const shiftTypeCards = useMemo(
    () =>
      (shiftTypes || []).map((t) => {
        const defaults = DEFAULT_HOURS_BY_CODE[t.code] || null;
        const timeLabel = defaults
          ? `${defaults.start_time} - ${defaults.end_time}`
          : "—";
        return {
          id: String(t.id),
          code: t.code,
          name: t.name,
          color: t.color_hex,
          timeLabel,
        };
      }),
    [shiftTypes]
  );

  const selectedTypeObj = useMemo(
    () =>
      shiftTypes.find((t) => String(t.id) === String(selectedShiftTypeId)) ||
      null,
    [shiftTypes, selectedShiftTypeId]
  );
  const defaultHoursForSelected = useMemo(
    () =>
      selectedTypeObj
        ? DEFAULT_HOURS_BY_CODE[selectedTypeObj.code] || null
        : null,
    [selectedTypeObj]
  );

  const getWeeksInRange = () => {
    if (!weekRange.start || !weekRange.end) return 0;
    const start = new Date(weekRange.start);
    const end = new Date(weekRange.end);
    return Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24 * 7));
  };

  const enumerateDates = (startISO, endISO, excludeWknds) => {
    if (!startISO || !endISO) return [];
    let cursor = startISO;
    const out = [];
    while (cursor <= endISO) {
      if (!excludeWknds || !isWeekend(cursor)) out.push(cursor);
      cursor = addDays(cursor, 1);
    }
    return out;
  };

  // Asignar
  const handleAssignShift = async () => {
    if (!selectedEmployee || !selectedShiftTypeId || !weekRange.start) {
      alert("Completa empleado, tipo y fecha de inicio");
      return;
    }
    if (!defaultHoursForSelected) {
      alert("Este tipo no tiene horas por defecto configuradas.");
      return;
    }
    if (!Number.isInteger(Number(intervalWeeks)) || Number(intervalWeeks) < 1) {
      alert("Intervalo de semanas debe ser >= 1");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const typeId = Number(selectedShiftTypeId);
      const { start_time, end_time } = defaultHoursForSelected;

      if (!overrideExisting) {
        // Serie (end opcional -> null = sin fin)
        const weekdays = excludeWeekends
          ? ["MO", "TU", "WE", "TH", "FR"]
          : ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];

        await createSeries({
          employee_id: Number(selectedEmployee),
          type_id: typeId,
          start_date: weekRange.start,
          end_date: weekRange.end || null,
          start_time,
          end_time,
          weekdays,
          interval_weeks: Number(intervalWeeks),
          tz_name: "Europe/Madrid",
          notes: additionalNotes || undefined,
        });
        alert("Serie creada correctamente");
      } else {
        // Expresos
        if (!weekRange.end) {
          alert("Para expresos necesitas fecha de fin");
          return;
        }
        const days = enumerateDates(
          weekRange.start,
          weekRange.end,
          excludeWeekends
        );
        for (const dayISO of days) {
          await createShift({
            employee_id: Number(selectedEmployee),
            type_id: Number(selectedShiftTypeId),
            date: dayISO,
            start_time,
            end_time,
            notes: additionalNotes || undefined,
            status: "planned",
          });
        }
        alert("Turnos expresos creados.");
      }

      setAdditionalNotes("");
      setIntervalWeeks(1);

      if (weekRange.end) {
        const shifts = await listShifts({
          from: weekRange.start,
          to: weekRange.end,
          employeeId: Number(selectedEmployee),
        });
        setRecentShifts(shifts || []);
      }
    } catch (e) {
      setError(e.message || "No se pudo asignar el turno");
      alert(e.message || "No se pudo asignar el turno");
    } finally {
      setSubmitting(false);
    }
  };

  // Eliminar un expreso
  const handleDeleteShift = async (id) => {
    if (!id) return;
    await deleteShift(id);
    const shifts = await listShifts({
      from: weekRange.start,
      to: weekRange.end,
      employeeId: Number(selectedEmployee),
    });
    setRecentShifts(shifts || []);
  };

  // Cancelar ocurrencia de serie (excepción cancel)
  const cancelOccurrence = async (series_id, dateISO) => {
    try {
      await upsertSeriesException(series_id, { date: dateISO, action: "cancel" });
      const shifts = await listShifts({
        from: weekRange.start,
        to: weekRange.end,
        employeeId: Number(selectedEmployee),
      });
      setRecentShifts(shifts || []);
    } catch (e) {
      alert(e.message || "No se pudo cancelar el día");
    }
  };

  // BORRAR TODO EL RANGO (expresos + ocurrencias de serie)
  const handleDeleteAllInRange = async () => {
    if (!selectedEmployee || !weekRange.start || !weekRange.end) {
      alert("Selecciona empleado y un rango de fechas (inicio y fin).");
      return;
    }
    const ok = confirm(
      `¿Eliminar TODOS los turnos del ${weekRange.start} al ${weekRange.end}?\n` +
        "- Los expresos se borrarán.\n" +
        "- Las ocurrencias de serie se cancelarán (excepción por día)."
    );
    if (!ok) return;

    try {
      setDeletingRange(true);

      const shifts = await listShifts({
        from: weekRange.start,
        to: weekRange.end,
        employeeId: Number(selectedEmployee),
      });

      // Borrar expresos
      const explicit = (shifts || []).filter((s) => s.id && !s.generated);
      for (const s of explicit) {
        await deleteShift(s.id);
      }

      // Cancelar ocurrencias de serie
      const generated = (shifts || []).filter(
        (s) => s.generated && s.series_id && s.date
      );
      for (const s of generated) {
        await upsertSeriesException(s.series_id, {
          date: s.date,
          action: "cancel",
        });
      }

      const refreshed = await listShifts({
        from: weekRange.start,
        to: weekRange.end,
        employeeId: Number(selectedEmployee),
      });
      setRecentShifts(refreshed || []);
      alert("Turnos eliminados/cancelados en el rango.");
    } catch (e) {
      alert(e.message || "No se pudo eliminar el rango");
    } finally {
      setDeletingRange(false);
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
                {/* Empleado + Intervalo */}
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

                    {/* Intervalo semanas */}
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
                          placeholder="1 = todas, 2 = alternas…"
                        />
                        <div className="hint">1 = todas · 2 = alternas · 3 = cada 3…</div>
                      </div>
                    </div>
                  </div>

                  {/* Tipos */}
                  <div className="form-group">
                    <label className="form-label">Tipo de Horario</label>
                    <div className="shift-types-grid">
                      {shiftTypeCards.map((shift) => (
                        <div
                          key={shift.id}
                          className={`shift-type-card ${
                            String(selectedShiftTypeId) === String(shift.id) ? "selected" : ""
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
                            {shift.code === "MORNING" && (
                              <i className="fa-solid fa-sun" />
                            )}
                            {shift.code === "EVENING" && (
                              <i className="fa-solid fa-cloud-sun" />
                            )}
                            {shift.code === "REGULAR" && (
                              <i className="fa-solid fa-clock" />
                            )}
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

                {/* Opciones */}
                <div className="checkbox-group">
                  <label className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={excludeWeekends}
                      onChange={(e) => setExcludeWeekends(e.target.checked)}
                    />
                    Excluir fines de semana
                  </label>
                  <label className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={overrideExisting}
                      onChange={(e) => setOverrideExisting(e.target.checked)}
                    />
                    Crear como turnos diarios (expresos)
                  </label>
                </div>

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
                          onChange={(e) =>
                            setWeekRange((p) => ({ ...p, end: e.target.value }))
                          }
                        />
                        <small className="hint">Déjalo vacío para serie sin fin</small>
                      </div>
                    </div>

                    {weekRange.start && weekRange.end && (
                      <div className="range-info">
                        <div className="info-badge">
                          <i className="fa-solid fa-info-circle" />
                          El horario se aplicará a los días del rango
                          {excludeWeekends ? " (solo laborables)" : ""}.
                        </div>
                        <div className="weeks-counter">
                          <strong>{getWeeksInRange()}</strong> semanas aproximadamente
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notas */}
                <div className="form-group">
                  <label className="form-label">Notas adicionales</label>
                  <textarea
                    className="form-textarea"
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="Opcional"
                  />
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
                      setExcludeWeekends(true);
                      setOverrideExisting(false);
                      setAdditionalNotes("");
                      setIntervalWeeks(1);
                      setRecentShifts([]);
                    }}
                    disabled={submitting}
                  >
                    <i className="fa-solid fa-times" />
                    Cancelar
                  </button>

                  <button
                    className="btn btn-secondary"
                    onClick={handleDeleteAllInRange}
                    disabled={
                      submitting ||
                      deletingRange ||
                      !selectedEmployee ||
                      !weekRange.start ||
                      !weekRange.end
                    }
                    title="Borra expresos y cancela ocurrencias de series dentro del rango seleccionado"
                  >
                    {deletingRange ? "Eliminando…" : "Eliminar todo el rango"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Listado de turnos */}
        <div className="assignment-preview" style={{ marginTop: 24 }}>
          <div className="preview-header">
            <i className="fa-solid fa-calendar-check" />
            Turnos asignados en el rango
          </div>

          {!recentShifts || recentShifts.length === 0 ? (
            <div className="preview-placeholder">No hay turnos en este rango.</div>
          ) : (
            <div className="preview-content">
              {recentShifts.map((s) => (
                <div
                  key={s.id || `${s.series_id}-${s.date}-${s.start_time}`}
                  className="preview-item"
                >
                  <div>
                    <strong>{s.date}</strong> · {s.type?.name || "—"} ({s.start_time}–
                    {s.end_time})
                    {s.generated ? " · (de serie)" : ""}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      marginTop: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    {!s.generated && s.id ? (
                      <button
                        className="btn btn-primary"
                        onClick={() => handleDeleteShift(s.id)}
                      >
                        Eliminar
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary"
                        onClick={() => cancelOccurrence(s.series_id, s.date)}
                      >
                        Cancelar este día
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};






