import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Loader } from "../Loader/Loader";

const MEGABYTE = 1024 * 1024;
const MAX_FILE_MB = 10;

const MONTHS = [
  { value: 1, label: "Enero" },
  { value: 2, label: "Febrero" },
  { value: 3, label: "Marzo" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Mayo" },
  { value: 6, label: "Junio" },
  { value: 7, label: "Julio" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Septiembre" },
  { value: 10, label: "Octubre" },
  { value: 11, label: "Noviembre" },
  { value: 12, label: "Diciembre" },
];

export const AdminPayroll = () => {
  const { token } = useAuth();

  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    employeeId: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    file: null,
  });

  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  const [uploads, setUploads] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const fileInputRef = useRef(null);

  const headersAuth = useMemo(
    () =>
      token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
    [token]
  );

  // Empleados
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const res = await fetch("/employees", { headers: { ...headersAuth } }); // ajusta prefijo /api si procede
        const data = await res.json();
        setEmployees(Array.isArray(data) ? data : []);
      } catch {
        setEmployees([]);
      }
    };
    loadEmployees();
  }, [headersAuth]);

  // Últimas subidas
  const fetchUploads = async (p = 1) => {
    try {
      const res = await fetch(`/payrolls?limit=10&page=${p}`, {
        headers: { ...headersAuth },
      });
      const data = await res.json();
      // Soporta formatos {items, total_pages} o array directo
      if (Array.isArray(data)) {
        setUploads(data);
        setTotalPages(p);
      } else {
        setUploads(data.items || []);
        setTotalPages(data.total_pages || 1);
      }
    } catch {
      setUploads([]);
      setTotalPages(1);
    }
  };

  useEffect(() => {
    fetchUploads(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, token]);

  const years = useMemo(() => {
    const y = new Date().getFullYear();
    return Array.from({ length: 11 }, (_, i) => y - i);
  }, []);

  const onSelectFile = (file) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Solo se admite PDF.");
      return;
    }
    if (file.size > MAX_FILE_MB * MEGABYTE) {
      setError(`El archivo supera ${MAX_FILE_MB}MB.`);
      return;
    }
    setError("");
    setForm((f) => ({ ...f, file }));
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    onSelectFile(file);
  };

  const onBrowse = (e) => {
    const file = e.target.files?.[0];
    onSelectFile(file);
  };

  const resetForm = () => {
    setForm({
      employeeId: "",
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      file: null,
    });
    setError("");
    setOk(false);
    fileInputRef.current && (fileInputRef.current.value = "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOk(false);
    setError("");

    if (!form.employeeId) return setError("Selecciona un empleado.");
    if (!form.file) return setError("Adjunta el PDF de la nómina.");

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("employee_id", form.employeeId);
      fd.append("month", String(form.month));
      fd.append("year", String(form.year));
      fd.append("file", form.file);

      const res = await fetch("/payrolls", {
        method: "POST",
        headers: { ...headersAuth }, // no fijar Content-Type con FormData
        body: fd,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Error subiendo la nómina.");
      }

      setOk(true);
      resetForm();
      fetchUploads(1);
      setPage(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async (id) => {
    try {
      const res = await fetch(`/payrolls/${id}/download`, {
        headers: { ...headersAuth },
      });
      if (!res.ok) throw new Error("No se pudo descargar.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nomina_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // opcional: mostrar toast
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar esta nómina?")) return;
    try {
      const res = await fetch(`/payrolls/${id}`, {
        method: "DELETE",
        headers: { ...headersAuth },
      });
      if (!res.ok) throw new Error("No se pudo eliminar.");
      setUploads((u) => u.filter((x) => x.id !== id));
    } catch {
      // opcional: mostrar toast
    }
  };

  return (
    <div className="content-area">
      <div className="content-header">
        <h1 className="content-title">Subir Nómina</h1>
        <p className="content-subtitle">
          Sube documentos PDF de nóminas para que los empleados puedan
          descargarlos.
        </p>
      </div>

      <div className="panel" style={{ padding: 24, marginBottom: 24 }}>
        <form onSubmit={handleSubmit} className="form-grid">
          {/* Empleado */}
          <div className="form-row" style={{ marginBottom: 16 }}>
            <label className="form-label">Seleccionar empleado</label>
            <select
              className="form-control"
              value={form.employeeId}
              onChange={(e) =>
                setForm((f) => ({ ...f, employeeId: e.target.value }))
              }
            >
              <option value="">Elige un empleado…</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.first_name} {e.last_name} {e.email ? `— ${e.email}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Periodo de pago */}
          <div
            className="form-row"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginBottom: 16,
            }}
          >
            <div>
              <label className="form-label">Mes</label>
              <select
                className="form-control"
                value={form.month}
                onChange={(e) =>
                  setForm((f) => ({ ...f, month: Number(e.target.value) }))
                }
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Año</label>
              <select
                className="form-control"
                value={form.year}
                onChange={(e) =>
                  setForm((f) => ({ ...f, year: Number(e.target.value) }))
                }
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* PDF */}
          <div className="form-row" style={{ marginBottom: 16 }}>
            <label className="form-label">Documento de nómina (PDF)</label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`dropzone ${dragOver ? "is-over" : ""}`}
              style={{
                border: "1px dashed #cbd5e1",
                borderRadius: 12,
                padding: 24,
                textAlign: "center",
              }}
            >
              {form.file ? (
                <div style={{ lineHeight: 1.5 }}>
                  <strong>{form.file.name}</strong>
                  <div>
                    {(form.file.size / MEGABYTE).toFixed(2)} MB — PDF
                  </div>
                  <button
                    type="button"
                    className="btn btn-link"
                    onClick={() => onSelectFile(null)}
                    style={{ marginTop: 8 }}
                  >
                    Quitar archivo
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 8 }}>
                    Arrastra el PDF aquí
                  </div>
                  <div>
                    o{" "}
                    <button
                      type="button"
                      className="btn btn-link"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      examina tus archivos
                    </button>
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>
                    Tamaño máximo: {MAX_FILE_MB}MB
                  </div>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={onBrowse}
                hidden
              />
            </div>
          </div>

          {/* Acciones */}
          <div
            className="form-actions"
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "flex-end",
              alignItems: "center",
            }}
          >
            {submitting ? <Loader /> : null}
            {error && (
              <span className="form-error" style={{ color: "#b91c1c" }}>
                {error}
              </span>
            )}
            {ok && (
              <span
                className="form-ok"
                style={{ color: "#16a34a", fontWeight: 600 }}
              >
                ¡Nómina subida!
              </span>
            )}
            <button type="button" className="btn" onClick={resetForm}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              Subir nómina
            </button>
          </div>
        </form>
      </div>

      {/* Listado de subidas recientes */}
      <div className="panel" style={{ padding: 16 }}>
        <h2 style={{ margin: "8px 0 16px" }}>Subidas recientes</h2>

        {uploads.length === 0 ? (
          <p style={{ opacity: 0.7, margin: 0 }}>Aún no hay nóminas.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {uploads.map((u) => (
              <li
                key={u.id}
                className="upload-item"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  marginBottom: 10,
                  background: "#fff",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <strong style={{ marginBottom: 2 }}>
                    {u.employee_name
                      ? `${u.employee_name} - ${MONTHS.find((m) => m.value === Number(u.month))?.label || u.month} ${u.year}`
                      : u.title || `Nómina #${u.id}`}
                  </strong>
                  <small style={{ opacity: 0.7 }}>
                    {u.uploaded_at
                      ? new Date(u.uploaded_at).toLocaleString()
                      : "Fecha desconocida"}
                  </small>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    className="badge"
                    style={{
                      fontSize: 12,
                      padding: "4px 8px",
                      borderRadius: 999,
                      background: "#ecfdf5",
                      color: "#065f46",
                    }}
                  >
                    {u.status?.toLowerCase() === "delivered"
                      ? "Entregada"
                      : u.status || "Entregada"}
                  </span>

                  <details style={{ position: "relative" }}>
                    <summary
                      style={{
                        listStyle: "none",
                        cursor: "pointer",
                        padding: "6px 10px",
                        borderRadius: 8,
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      ⋯
                    </summary>
                    <div
                      style={{
                        position: "absolute",
                        right: 0,
                        top: "110%",
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 10,
                        boxShadow: "0 8px 24px rgba(17,24,39,.08)",
                        minWidth: 160,
                        zIndex: 10,
                      }}
                    >
                      <button
                        className="menu-item"
                        onClick={() => handleDownload(u.id)}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "10px 12px",
                          background: "transparent",
                          border: 0,
                          cursor: "pointer",
                        }}
                      >
                        Descargar
                      </button>
                      <button
                        className="menu-item"
                        onClick={() => handleDelete(u.id)}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "10px 12px",
                          background: "transparent",
                          border: 0,
                          cursor: "pointer",
                          color: "#b91c1c",
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </details>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Paginación */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
            marginTop: 10,
          }}
        >
          <button
            className="btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            ◀
          </button>
          <span style={{ opacity: 0.8 }}>
            {page} / {totalPages}
          </span>
          <button
            className="btn"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  );
};
