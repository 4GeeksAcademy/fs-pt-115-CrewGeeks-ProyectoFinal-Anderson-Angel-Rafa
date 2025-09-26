import React, { useState } from "react";
import "./AdminShiftAssignment.css";

export const AdminShiftAssignment = () => {
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedShiftType, setSelectedShiftType] = useState("");
  const [weekRange, setWeekRange] = useState({ start: "", end: "" });
  const [excludeWeekends, setExcludeWeekends] = useState(false);
  const [overrideExisting, setOverrideExisting] = useState(false);
  const [notifyEmployee, setNotifyEmployee] = useState(true);
  const [additionalNotes, setAdditionalNotes] = useState("");

  const employees = [
    { id: 1, name: "Juan Pérez", position: "Desarrollador" },
    { id: 2, name: "María García", position: "Diseñadora" },
    { id: 3, name: "Carlos López", position: "Analista" },
    { id: 4, name: "Ana Martín", position: "QA Tester" },
  ];

  const shiftTypes = [
    { id: "morning", name: "Turno Mañana", time: "08:00 - 16:00"  },
    { id: "afternoon", name: "Turno Tarde", time: "14:00 - 22:00"  },
    { id: "night", name: "Turno Noche", time: "22:00 - 06:00"   },
    { id: "flexible", name: "Horario Flexible", time: "Personalizado"},
  ];

  const getWeeksInRange = () => {
    if (!weekRange.start || !weekRange.end) return 0;
    const start = new Date(weekRange.start);
    const end = new Date(weekRange.end);
    return Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24 * 7));
  };

  const handleAssignShift = () => {
    if (!selectedEmployee || !selectedShiftType || !weekRange.start || !weekRange.end) {
      alert("Por favor completa todos los campos obligatorios");
      return;
    }
    console.log("Asignando turno:", {
      employee: selectedEmployee,
      shiftType: selectedShiftType,
      weekRange,
      options: { excludeWeekends, overrideExisting, notifyEmployee },
      notes: additionalNotes,
    });
    alert("Turno asignado correctamente");
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

            <div className="form-content">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Seleccionar Empleado</label>
                  <select
                    className="form-select"
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                  >
                    <option value="">Selecciona un empleado...</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} - {emp.position}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Tipo de Horario</label>
                <div className="shift-types-grid">
                  {shiftTypes.map((shift) => (
                    <div
                      key={shift.id}
                      className={`shift-type-card ${selectedShiftType === shift.id ? "selected" : ""}`}
                      onClick={() => setSelectedShiftType(shift.id)}
                    >
                      <div
                        className="shift-icon"
                        style={{ backgroundColor: shift.color + "20", color: shift.color }}
                      >
                        {shift.icon}
                      </div>
                      <div className="shift-info">
                        <div className="shift-name">{shift.name}</div>
                        <div className="shift-time">{shift.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

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
                        onChange={(e) => setWeekRange((p) => ({ ...p, start: e.target.value }))}
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
                        El horario se aplicará a todos los días laborables del rango.
                      </div>
                      <div className="weeks-counter">
                        <strong>{getWeeksInRange()}</strong> semanas aproximadamente
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button className="btn btn-primary" onClick={handleAssignShift}>
                  <i className="fa-solid fa-check" />
                  Asignar Turno
                </button>
                <button className="btn btn-secondary">
                  <i className="fa-solid fa-times" />
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
