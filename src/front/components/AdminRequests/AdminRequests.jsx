// src/front/components/AdminSolicitudes/AdminSolicitudes.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth.jsx";
import { Loader } from "../Loader/Loader.jsx";
import * as HolidaysAPI from "../../services/holidaysAPI.js";
import "./AdminRequests.css";

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const rangeEs = (startISO, endISO) => {
  if (!startISO) return "-";
  const s = new Date(startISO), e = new Date(endISO || startISO);
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${s.getDate()}-${e.getDate()} ${MONTHS_ES[e.getMonth()]} ${e.getFullYear()}`;
  }
  return `${s.getDate()} ${MONTHS_ES[s.getMonth()]} - ${e.getDate()} ${MONTHS_ES[e.getMonth()]} ${e.getFullYear()}`;
};
const daysText = (n) => (n === 0.5 ? "Medio día" : n === 1 ? "1 día" : `${n ?? "-"} días`);
const normStatus = (s) => {
  const v = (s || "pending").toLowerCase();
  return v === "rejected" ? "denied" : v;
};


const Badge = ({ status }) => (
  <span
    className={
      "admin-req__badge " +
      (status === "approved"
        ? "admin-req__badge--approved"
        : status === "denied"
          ? "admin-req__badge--denied"
          : "admin-req__badge--pending")
    }
  >
    {status === "approved" ? "Aprobada" : status === "denied" ? "Denegada" : "Pendiente"}
  </span>
);

// ---- compat con TU holidaysAPI sin tocarla ----
async function compatList(token) {
  const fn =
    HolidaysAPI.listHolidays ||
    HolidaysAPI.getHolidays ||
    HolidaysAPI.fetchHolidays ||
    HolidaysAPI.getAllHolidays ||
    HolidaysAPI.index ||
    HolidaysAPI.list;

  if (!fn) throw new Error("holidaysAPI: falta función de listado");

  // prueba firmas comunes (los args extra se ignoran si no se usan)
  try { return await fn(token); } catch { }
  try { return await fn({ token }); } catch { }
  try { return await fn(); } catch { }
  throw new Error("holidaysAPI: no se pudo listar");
}

async function compatSetStatus(token, id, status) {
  const patch =
    HolidaysAPI.setHolidayStatus ||
    HolidaysAPI.updateHoliday ||
    HolidaysAPI.patchHoliday ||
    HolidaysAPI.updateHolidayStatus ||
    HolidaysAPI.update ||
    HolidaysAPI.patch;

  const approve = HolidaysAPI.approveHoliday || HolidaysAPI.approve;
  const deny = HolidaysAPI.denyHoliday || HolidaysAPI.rejectHoliday || HolidaysAPI.deny || HolidaysAPI.reject;


  if (patch) {
    try { return await patch(id, { status }, token); } catch { }
    try { return await patch(id, status, token); } catch { }
    try { return await patch(token, id, status); } catch { }
    try { return await patch({ id, status, token }); } catch { }
  }

  if (status === "approved" && approve) {
    try { return await approve(id, token); } catch { }
    try { return await approve(token, id); } catch { }
    try { return await approve(id); } catch { }
  }
  if (status === "denied" && deny) {
    try { return await deny(id, token); } catch { }
    try { return await deny(token, id); } catch { }
    try { return await deny(id); } catch { }
  }

  throw new Error("holidaysAPI: no hay método para cambiar estado");
}

const mapItem = (r) => {
  const emp = r.employee || r.user || {};
  const fullName =
    emp.full_name ||
    [emp.first_name, emp.last_name].filter(Boolean).join(" ") ||
    r.employee_name ||
    (r.employee_id ? `Empleado #${r.employee_id}` : "Empleado");

  const avatar = emp.image || emp.avatar_url || r.employee_image || "https://via.placeholder.com/40";
  const start = r.start_date || r.start || r.from || r.begin;
  const end = r.end_date || r.end || r.to || r.finish;
  const reason = r.reason || r.type || (r.category === "vacation" ? "Solicitud de vacaciones" : "Permiso");
  const days =
    r.duration_days ?? r.days ?? r.total_days ?? (start && (start === end || !end) ? 1 : undefined);

  return {
    id: r.id,
    employee_id: r.employee_id,
    status: normStatus(r.status || r.state || r.approval_status),
    employee: { full_name: fullName, image: avatar },
    start_date: start,
    end_date: end,
    reason,
    days,
  };
};

export const AdminRequests = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try {
      const data = await compatList(token);
      const raw =
        Array.isArray(data) ? data :
          data?.items ?? data?.results ?? data?.data?.items ?? data?.data?.results ?? data?.holidays ?? [];
      const mapped = raw.map(mapItem);
      try {
        // Cargar empleados para mapear nombre e imagen
        const mod = await import('../../services/employeesAPI.js');
        const employees = await (mod.getAllEmployees ? mod.getAllEmployees() : []);
        const byId = Object.fromEntries((employees || []).map(e => [e.id, e]));
        mapped.forEach(it => {
          const emp = byId[it.employee_id];
          if (emp) {
            const fullName = [emp.first_name, emp.last_name].filter(Boolean).join(' ');
            it.employee = {
              full_name: fullName || it.employee?.full_name || `Empleado #${it.employee_id}`,
              image: emp.image || it.employee?.image || 'https://via.placeholder.com/40'
            };
          }
        });
      } catch (e) {
        // si falla, seguimos con lo que venía del endpoint
      }
      setItems(mapped);

    } catch (e) {
      setError("No se pudieron cargar las solicitudes.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [token]);

  const applyStatus = async (id, status) => {
    try {
      await compatSetStatus(token, id, status);
      setItems(prev => prev.map(r => (r.id === id ? { ...r, status } : r)));
    } catch {
      // opcional: toast
    }
  };

  return (
    <section className="content-area">
      <div className="content-header">
        <div className="content-title">Gestión de Solicitudes</div>
        <div className="content-subtitle">Revisa y gestiona las solicitudes de vacaciones.</div>
        </div>

      <div className="content-body">
        <div className="admin-req__panel-head">
          <span>Solicitudes</span>
          <div className="admin-req__head-meta">
            {loading && <Loader />}
            {error && <span className="admin-req__error">{error}</span>}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="admin-req__empty">No hay solicitudes.</div>
        ) : (
          <ul className="admin-req__list">
            {items.map((r) => (
              <li className="admin-req__row" key={r.id}>
                <div className="admin-req__who">
                  <img className="admin-req__avatar" src={r.employee.image} alt={r.employee.full_name} />
                  <div className="admin-req__who-meta">
                    <strong className="admin-req__name">{r.employee.full_name}</strong>
                    <small className="admin-req__reason">{r.reason}</small>
                  </div>
                </div>

                <div className="admin-req__range">
                  <div className="admin-req__range-text">{rangeEs(r.start_date, r.end_date)}</div>
                  <small className="admin-req__days">{daysText(r.days)}</small>
                </div>

                <div className="admin-req__actions">
                  <Badge status={r.status} />
                  <button
                    className="admin-req__btn admin-req__btn--approve"
                    onClick={() => applyStatus(r.id, "approved")}
                    >
                    ✓ Aprobar
                  </button>
                  <button
                    className="admin-req__btn admin-req__btn--deny"
                    onClick={() => applyStatus(r.id, "denied")}
                    >
                    ✕ Denegar
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
