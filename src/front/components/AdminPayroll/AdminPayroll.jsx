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

const urlApi = import.meta.env.VITE_BACKEND_URL + "/api";

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
  const fileInputId = "payroll-pdf-input";

  const headersAuth = useMemo(
    () =>
      token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
    [token]
  );

  // Empleados (de la misma empresa)
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const response = await fetch(`${urlApi}/employees`, {
          headers: { ...headersAuth },
        });
        const data = await response.json();
        setEmployees(Array.isArray(data) ? data : []);
      } catch {
        setEmployees([]);
      }
    };
    loadEmployees();
  }, [headersAuth]);

  // Últimas subidas
  const fetchUploads = async (newPage = 1) => {
    try {
      const response = await fetch(
        `${urlApi}/payrolls?limit=10&page=${newPage}`,
        { headers: { ...headersAuth } }
      );
      const data = await response.json();
      if (Array.isArray(data)) {
        setUploads(data);
        setTotalPages(newPage);
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
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 11 }, (_, index) => currentYear - index);
  }, []);

  const onSelectFile = (file) => {
    if (!file) {
      setForm((prev) => ({ ...prev, file: null }));
      return;
    }
    if (file.type !== "application/pdf") {
      setError("Solo se admite PDF.");
      return;
    }
    if (file.size > MAX_FILE_MB * MEGABYTE) {
      setError(`El archivo supera ${MAX_FILE_MB}MB.`);
      return;
    }
    setError("");
    setForm((prev) => ({ ...prev, file }));
  };

  const onDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(false);
    const file = event.dataTransfer.files?.[0];
    onSelectFile(file);
  };

  const onBrowse = (event) => {
    const file = event.target.files?.[0];
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
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setOk(false);
    setError("");

    if (!form.employeeId) return setError("Selecciona un empleado.");
    if (!form.file) return setError("Adjunta el PDF de la nómina.");

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("employee_id", form.employeeId);
      formData.append("month", String(form.month));
      formData.append("year", String(form.year));
      formData.append("file", form.file);

      const response = await fetch(`${urlApi}/payrolls`, {
        method: "POST",
        headers: { ...headersAuth }, // no fijar Content-Type con FormData
        body: formData,
      });

      if (!response.ok) {
        const responseError = await response.json().catch(() => ({}));
        throw new Error(
          responseError?.error || responseError?.msg || "Error subiendo la nómina."
        );
      }

      setOk(true);
      resetForm();
      setPage(1);
      fetchUploads(1);
    } catch (caughtError) {
      setError(caughtError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async (payrollId) => {
    try {
      const response = await fetch(`${urlApi}/payrolls/${payrollId}/download`, {
        headers: { ...headersAuth },
      });
      if (!response.ok) throw new Error("No se pudo descargar.");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `nomina_${payrollId}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      // opcional: toast
    }
  };

  const handleDelete = async (payrollId) => {
    if (!confirm("¿Eliminar esta nómina?")) return;
    try {
      const response = await fetch(`${urlApi}/payrolls/${payrollId}`, {
        method: "DELETE",
        headers: { ...headersAuth },
      });
      if (!response.ok) throw new Error("No se pudo eliminar.");
      setUploads((prev) => prev.filter((item) => item.id !== payrollId));
    } catch {
      // opcional: toast
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
            <label className="form-label" htmlFor="employee-select">
              Seleccionar empleado
            </label>
            <select
              id="employee-select"
              className="form-control"
              value={form.employeeId}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, employeeId: event.target.value }))
              }
            >
              <option value="">Elige un empleado…</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.first_name} {employee.last_name}{" "}
                  {employee.email ? `— ${employee.email}` : ""}
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
              <label className="form-label" htmlFor="month-select">
                Mes
              </label>
              <select
                id="month-select"
                className="form-control"
                value={form.month}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    month: Number(event.target.value),
                  }))
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
              <label className="form-label" htmlFor="year-select">
                Año
              </label>
              <select
                id="year-select"
                className="form-control"
                value={form.year}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    year: Number(event.target.value),
                  }))
                }
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* PDF (fila ancho completo; label arriba, dropzone debajo) */}
          <div
            className="form-row"
            style={{
              marginBottom: 16,
              gridColumn: "1 / -1",
              display: "block",
            }}
          >
            <label
              className="form-label"
              htmlFor={fileInputId}
              style={{ display: "block", marginBottom: 8 }}
            >
              Documento de nómina (PDF)
            </label>

            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`dropzone ${dragOver ? "is-over" : ""}`}
              style={{
                width: "100%",
                border: "1px dashed #cbd5e1",
                borderRadius: 12,
                padding: 24,
                textAlign: "center",
                background: "#f8fafc",
              }}
            >
              {form.file ? (
                <div style={{ lineHeight: 1.5 }}>
                  <strong>{form.file.name}</strong>
                  <div>{(form.file.size / MEGABYTE).toFixed(2)} MB — PDF</div>
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
                  <div style={{ marginBottom: 8 }}>Arrastra el PDF aquí</div>
                  <div>
                    o{" "}
                    <button
                      type="button"
                      className="btn btn-link"
                      onClick={() => fileInputRef.current?.click()}
                      aria-controls={fileInputId}
                    >
                      examina tus archivos
                    </button>
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>
                    Tamaño máximo: {MAX_FILE_MB}MB
                  </div>
                </>
              )}

              {/* input oculto */}
              <input
                id={fileInputId}
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
            <button type="submit" className="btn btn-primary" disabled={submitting}>
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
            {uploads.map((uploadItem) => (
              <li
                key={uploadItem.id}
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
                    {uploadItem.employee_name
                      ? `${uploadItem.employee_name} - ${
                          MONTHS.find(
                            (m) => m.value === Number(uploadItem.period_month)
                          )?.label ||
                          MONTHS.find(
                            (m) => m.value === Number(uploadItem.month)
                          )?.label ||
                          uploadItem.period_month ||
                          uploadItem.month
                        } ${uploadItem.period_year ?? uploadItem.year}`
                      : uploadItem.title || `Nómina #${uploadItem.id}`}
                  </strong>
                  <small style={{ opacity: 0.7 }}>
                    {uploadItem.uploaded_at
                      ? new Date(uploadItem.uploaded_at).toLocaleString()
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
                    {uploadItem.status?.toLowerCase() === "delivered"
                      ? "Entregada"
                      : uploadItem.status || "Entregada"}
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
                        onClick={() => handleDownload(uploadItem.id)}
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
                        onClick={() => handleDelete(uploadItem.id)}
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
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1}
          >
            ◀
          </button>
          <span style={{ opacity: 0.8 }}>
            {page} / {totalPages}
          </span>
          <button
            className="btn"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages}
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  );
};

