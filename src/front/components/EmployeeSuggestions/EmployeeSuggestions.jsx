// EmployeeSuggestions.jsx
import React, { useEffect, useState } from "react";
import "./EmployeeSuggestions.css";

// Servicios existentes (manteniendo tu estructura de API)
import {
  getAllSuggestions,
  createSuggestion,  
  deleteSuggestion
} from "../../services/suggestionsAPI"; // mismo nombre de archivo que compartiste

// Helper mínimo para obtener el perfil y usar employee_id en el POST
async function getMyProfile(token) {
  const BASE = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");
  const r = await fetch(`${BASE}/api/employees/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error("Profile failed");
  return r.json(); // debe incluir .id
}

export const EmployeeSuggestions = () => {
  const token = localStorage.getItem("token"); // igual que usas en tus servicios
  const [me, setMe] = useState(null);

  const [description, setDescription] = useState("");
  const [tasks, setTasks] = useState([]);

  // Carga inicial: perfil (para employee_id) + lista de sugerencias reales
  useEffect(() => {
    (async () => {
      const profile = await getMyProfile(token);
      setMe(profile);
      const data = await getAllSuggestions(); // devuelve array de sugerencias { id, content, ... }
      setTasks(data || []);
    })().catch(console.error);
  }, [token]);

  // Crear desde la descripción, usando employee_id del perfil
  const addFromDescription = async () => {
    const text = description.trim();
    if (!text || !me) return;
    const created = await createSuggestion({ content: text, employee_id: me.id });
    setTasks((prev) => [created, ...prev]);
    setDescription("");
  };

  // Toggle visual (tu backend no maneja "done"; lo dejamos solo en UI)
  const toggleTask = (id) =>
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );

  // Borrar en backend + UI
  const removeTask = async (id) => {
    await deleteSuggestion(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <section className='content-area'>
      <div className='content-header'>
        <div className="content-title">Sugerencias</div>
        <div className="content-subtitle">Comparte ideas para mejorar la empresa.</div>
      </div>

      <div className="employee-suggestions">
        {/* Descripción de la tarea */}
        <section className="es-card es-left">
          <h2 className="es-title">Haz tu comentario</h2>

          <textarea
            className="es-textarea"
            placeholder="Describe la tarea o idea..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="es-actions">
            <button
              type="button"
              className="es-btn"
              onClick={addFromDescription}
              disabled={!description.trim() || !me}
            >
              Añadir a la lista
            </button>
          </div>
        </section>

        {/* Lista de tareas */}
        <section className="es-card es-right">
          <h2 className="es-title">Lista de sugerencias</h2>

          <ul className="es-list">
            {tasks.length === 0 && (
              <li className="es-empty">Sin sugerencias aún</li>
            )}
            {tasks.map((t) => (
              <li key={t.id} className={`es-item ${t.done ? "es-item--done" : ""}`}>
                <label className="es-check" title="Marcar como completada">
                  <input
                    type="checkbox"
                    checked={!!t.done}
                    onChange={() => toggleTask(t.id)}
                  />
                  <span className="es-check__box" />
                </label>

                {/* CAMBIO ESTRICTO: usar 'content' del backend en lugar de 'text' */}
                <span className="es-text">{t.content}</span>

                <button
                  type="button"
                  className="es-del"
                  onClick={() => removeTask(t.id)}
                  aria-label="Eliminar tarea"
                  title="Eliminar"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
};
