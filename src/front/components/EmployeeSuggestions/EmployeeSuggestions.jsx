// EmployeeSuggestions.jsx - Versión Limpia
import React, { useEffect, useState } from "react";
import "./EmployeeSuggestions.css";

import {
  getAllSuggestions,
  createSuggestion,  
  deleteSuggestion,
  updateSuggestion
} from "../../services/suggestionsAPI";

async function getMyProfile(token) {
  const BASE = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");
  const r = await fetch(`${BASE}/api/employees/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error("Profile failed");
  return r.json();
}

export const EmployeeSuggestions = () => {
  const token = localStorage.getItem("token");
  const [me, setMe] = useState(null);
  const [description, setDescription] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    (async () => {
      const profile = await getMyProfile(token);
      setMe(profile);
      const data = await getAllSuggestions();
      setSuggestions(data || []);
    })().catch(console.error);
  }, [token]);

  const addSuggestion = async () => {
    const text = description.trim();
    if (!text || !me) return;
    
    const created = await createSuggestion({ 
      content: text, 
      employee_id: me.id
    });
    setSuggestions((prev) => [created, ...prev]);
    setDescription("");
  };

  const toggleReviewStatus = async (id) => {
    const suggestion = suggestions.find(s => s.id === id);
    const updated = await updateSuggestion(id, { 
      ...suggestion, 
      reviewed: !suggestion.reviewed 
    });
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? updated : s))
    );
  };

  const deleteSuggestionItem = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta sugerencia?')) {
      await deleteSuggestion(id);
      setSuggestions((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const startEditing = (suggestion) => {
    setEditingId(suggestion.id);
    setEditText(suggestion.content);
  };

  const saveEdit = async () => {
    const text = editText.trim();
    if (!text) return;
    
    const suggestion = suggestions.find(s => s.id === editingId);
    const updated = await updateSuggestion(editingId, {
      ...suggestion,
      content: text
    });
    
    setSuggestions((prev) =>
      prev.map((s) => (s.id === editingId ? updated : s))
    );
    setEditingId(null);
    setEditText("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Hoy';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <section className='content-area'>
      <div className='content-header'>
        <div className="content-title">Sugerencias</div>
        <div className="content-subtitle">Comparte tus ideas para hacer nuestra empresa aún mejor</div>
      </div>

      <div className="employee-suggestions">
        {/* Formulario de Nueva Sugerencia */}
        <section className="suggestion-form-card">
          <div className="section-header">
            <div>
              <h2 className="form-title">Nueva Sugerencia</h2>
              <p className="content-subtitle">Tu opinión es valiosa para nosotros</p>
            </div>
          </div>

          <div className="form-body">
            <div className="form-group">
              <label className="form-label">Describe tu sugerencia</label>
              <textarea
                className="form-textarea"
                placeholder="Explica tu idea con el mayor detalle posible. ¿Qué problema resolvería? ¿Cómo podríamos implementarla?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <button
              type="button"
              className="submit-btn"
              onClick={addSuggestion}
              disabled={!description.trim() || !me}
            >
              Enviar Sugerencia
            </button>
          </div>
        </section>

        {/* Lista de Sugerencias */}
        <section className="suggestions-list-card">
          <div className="list-header">
            <h2 className="form-title">Mis Sugerencias</h2>
            <div className="suggestions-count">
              {suggestions.length} sugerencia{suggestions.length !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="suggestions-container">
            {suggestions.length === 0 ? (
              <div className="empty-state">
                <h3>Aún no has enviado sugerencias</h3>
                <p>¡Comparte tu primera idea para mejorar la empresa!</p>
              </div>
            ) : (
              <div className="suggestions-list">
                {suggestions.map((suggestion) => (
                  <div 
                    key={suggestion.id} 
                    className={`suggestion-item ${suggestion.reviewed ? 'suggestion-reviewed' : ''}`}
                  >
                    <div className="suggestion-header">
                      <div className="suggestion-meta">
                        <div className="suggestion-date">
                          Enviada el {formatDate(suggestion.created_at)}
                        </div>
                      </div>
                      <div className="suggestion-status">
                        {suggestion.reviewed ? (
                          <span className="status-reviewed">Revisada</span>
                        ) : (
                          <span className="status-pending"></span>
                        )}
                      </div>
                    </div>
                    
                    <div className="suggestion-content">
                      {editingId === suggestion.id ? (
                        <div className="form-group">
                          <textarea
                            className="form-textarea"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={3}
                          />
                          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                            <button
                              type="button"
                              className="action-btn toggle-btn"
                              onClick={saveEdit}
                              disabled={!editText.trim()}
                            >
                              Guardar
                            </button>
                            <button
                              type="button"
                              className="action-btn delete-btn"
                              onClick={cancelEdit}
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        suggestion.content
                      )}
                    </div>

                    {editingId !== suggestion.id && (
                      <div className="suggestion-actions">
                        {/* <button
                          type="button"
                          className="action-btn toggle-btn"
                          onClick={() => toggleReviewStatus(suggestion.id)}
                          title={suggestion.reviewed ? "Marcar como pendiente" : "Marcar como revisada"}
                        >
                          {suggestion.reviewed ? 'Pendiente' : 'Revisada'}
                        </button> */}
                        <button
                          type="button"
                          className="action-btn edit-btn"
                          onClick={() => startEditing(suggestion)}
                          title="Editar sugerencia"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="action-btn delete-btn"
                          onClick={() => deleteSuggestionItem(suggestion.id)}
                          title="Eliminar sugerencia"
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </section>
  );
};