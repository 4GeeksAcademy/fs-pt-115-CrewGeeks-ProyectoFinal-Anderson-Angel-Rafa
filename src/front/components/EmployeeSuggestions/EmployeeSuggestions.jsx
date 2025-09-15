// EmployeeSuggestions.jsx
import React, { useState } from "react";
import "./EmployeeSuggestions.css";

export const EmployeeSuggestions = () => {
  const [description, setDescription] = useState("");
  const [tasks, setTasks] = useState([]);

  const addFromDescription = () => {
    const text = description.trim();
    if (!text) return;
    setTasks((prev) => [{ id: Date.now(), text, done: false }, ...prev]);
    setDescription("");
  };

  const toggleTask = (id) =>
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );

  const removeTask = (id) =>
    setTasks((prev) => prev.filter((t) => t.id !== id));

  return (
    <div className="content-area content-header">
      <h1 className="content-title">Sugerencias</h1>
      <p className="content-subtitle">Comparte ideas para mejorar la empresa.</p>
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
              disabled={!description.trim()}
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
                    checked={t.done}
                    onChange={() => toggleTask(t.id)}
                  />
                  <span className="es-check__box" />
                </label>

                <span className="es-text">{t.text}</span>

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
    </div>
  );
};
