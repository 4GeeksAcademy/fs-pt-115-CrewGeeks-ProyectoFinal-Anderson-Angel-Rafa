import React, { useState, useMemo } from "react";
import "./EmployeeHolidays.css";

export const EmployeeHolidays = () => {
  // Estado del formulario (inicio, fin y motivo)
  const [formulario, setFormulario] = useState({
    inicio: "",
    fin: "",
    motivo: "",
  });

  // Lista de solicitudes registradas
  const [solicitudes, setSolicitudes] = useState([]);

  // Cálculo de días solicitados (inclusive)
  const diasSolicitados = useMemo(() => {
    if (!formulario.inicio || !formulario.fin) return 0;
    const fInicio = new Date(formulario.inicio);
    const fFin = new Date(formulario.fin);
    const dif = (fFin - fInicio) / (1000 * 60 * 60 * 24);
    if (isNaN(dif) || dif < 0) return 0;
    return Math.floor(dif) + 1;
  }, [formulario.inicio, formulario.fin]);

  // Actualizar campos del formulario al escribir
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormulario((f) => ({ ...f, [name]: value }));
  };

  // Enviar la solicitud: valida y añade a la lista
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formulario.inicio || !formulario.fin || diasSolicitados <= 0) return;

    const nuevaSolicitud = {
      id: Date.now(), // identificador sencillo
      inicio: formulario.inicio,
      fin: formulario.fin,
      dias: diasSolicitados,
      motivo: formulario.motivo.trim(),
      estado: "PENDIENTE", // estados: PENDIENTE, APROBADO, DENEGADO
    };

    // Añadir al inicio de la lista
    setSolicitudes((prev) => [nuevaSolicitud, ...prev]);
    // Reiniciar formulario
    setFormulario({ inicio: "", fin: "", motivo: "" });
  };

  // Cambiar estado de una solicitud
  const actualizarEstado = (id, nuevoEstado) => {
    setSolicitudes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, estado: nuevoEstado } : s))
    );
  };

  // Eliminar una solicitud de la lista
  const eliminarSolicitud = (id) => {
    setSolicitudes((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <section className="employee-holidays">
      <h1 className="employee-holidays__title">Vacaciones</h1>
      <p>Gestiona tus días de vacaciones y solicitudes</p>

      {/* Estadísticas de vacaciones */}
      <div className="employee-holidays__stats">
        <div className="employee-holidays__stat">
          <div className="employee-holidays__icon employee-holidays__icon--available">
            <i className="fa-solid fa-umbrella-beach" aria-hidden="true"></i>
          </div>
          <div className="employee-holidays__content">
            <span className="employee-holidays__value">22</span>
            <span className="employee-holidays__label">Días disponibles</span>
          </div>
        </div>
        <div className="employee-holidays__stat">
          <div className="employee-holidays__icon employee-holidays__icon--used">
            <i className="fa-solid fa-circle-check" aria-hidden="true"></i>
          </div>
          <div className="employee-holidays__content">
            <span className="employee-holidays__value">8</span>
            <span className="employee-holidays__label">Días usados</span>
          </div>
        </div>
        <div className="employee-holidays__stat">
          <div className="employee-holidays__icon employee-holidays__icon--pending">
            <i className="fa-solid fa-hourglass-half" aria-hidden="true"></i>
          </div>
          <div className="employee-holidays__content">
            <span className="employee-holidays__value">11</span>
            <span className="employee-holidays__label">Días pendientes</span>
          </div>
        </div>
        <div className="employee-holidays__stat">
          <div className="employee-holidays__icon employee-holidays__icon--remaining">
            <i className="fa-solid fa-file-lines" aria-hidden="true"></i>
          </div>
          <div className="employee-holidays__content">
            <span className="employee-holidays__value">3</span>
            <span className="employee-holidays__label">Días restantes</span>
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
            <span>Días:</span>
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
          <button type="submit" disabled={diasSolicitados <= 0}>
            Enviar solicitud
          </button>
          <button
            type="button"
            onClick={() => setFormulario({ inicio: "", fin: "", motivo: "" })}
          >
            Cancelar
          </button>
        </div>
      </form>

      {/* Listado de solicitudes */}
      <div className="employee-holidays__requests">
        <h2>Solicitudes</h2>
        {solicitudes.length === 0 ? (
          <p>No hay solicitudes.</p>
        ) : (
          <ul className="employee-holidays__list">
            {solicitudes.map((s) => (
              <li key={s.id} className="employee-holidays__item">
                <div>
                  <strong>
                    {s.inicio} — {s.fin}
                  </strong>{" "}
                  <span>({s.dias} días)</span>
                  {s.motivo && <span> · {s.motivo}</span>}
                </div>
                <span
                  className={`employee-holidays__estado ${s.estado.toLowerCase()}`}
                >
                  {s.estado}
                </span>
                <div className="employee-holidays__acciones">
                  <button
                    type="button"
                    onClick={() => actualizarEstado(s.id, "APROBADO")}
                  >
                    Aprobar
                  </button>
                    <button
                    type="button"
                    onClick={() => actualizarEstado(s.id, "DENEGADO")}
                  >
                    Denegar
                  </button>
                  <button
                    type="button"
                    onClick={() => eliminarSolicitud(s.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};
