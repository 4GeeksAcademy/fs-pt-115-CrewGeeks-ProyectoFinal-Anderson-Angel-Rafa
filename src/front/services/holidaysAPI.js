// holidaysAPI.js
const baseApiUrl = import.meta.env.VITE_BACKEND_URL + "/api";

// ---- Helpers: token seguro y cabeceras ----
export const getAccessToken = (maybeToken) => {
  if (maybeToken && maybeToken !== "undefined" && maybeToken !== "null") return maybeToken;

  const fromLocal = localStorage.getItem("token");
  if (fromLocal && fromLocal !== "undefined" && fromLocal !== "null") return fromLocal;

  const fromSession = sessionStorage.getItem("token");
  if (fromSession && fromSession !== "undefined" && fromSession !== "null") return fromSession;

  return null;
};

export const buildHeaders = (token, extra = {}) => {
  const safe = getAccessToken(token);
  return {
    ...(safe ? { Authorization: `Bearer ${safe}` } : {}),
    ...extra,
  };
};

// ---- Endpoints ----
export const getMyHolidayBalance = async (token, { year } = {}) => {
  const url = new URL(`${baseApiUrl}/holidays/balance/me`);
  if (year) url.searchParams.set("year", String(year));

  const response = await fetch(url.toString(), {
    headers: buildHeaders(token),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.msg || "Error al obtener el balance de vacaciones");
  }
  return data; // { company_id, employee_id, year, allocated_days, used_days, updated_at, pending_days, remaining_days }
};

export const listHolidays = async (token, { status, companyId } = {}) => {
  const url = new URL(`${baseApiUrl}/holidays/`);
  if (status) url.searchParams.set("status", String(status).toUpperCase());
  if (companyId != null) url.searchParams.set("company_id", String(companyId)); // OWNERDB

  const response = await fetch(url.toString(), {
    headers: buildHeaders(token),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.msg || "Error al listar las solicitudes de vacaciones");
  }
  return data; // array serialize()
};

export const getHolidayById = async (token, id) => {
  const response = await fetch(`${baseApiUrl}/holidays/${id}`, {
    headers: buildHeaders(token),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.msg || "Error al obtener la solicitud de vacaciones");
  }
  return data;
};

export const createHoliday = async (
  token,
  { start_date, end_date, reason, employee_id } = {}
) => {
  const payload = { start_date, end_date };
  if (reason != null) payload.reason = reason;
  // employee_id: válido si eres OWNERDB o ADMIN/HR creando para otra persona
  if (employee_id != null) payload.employee_id = employee_id;

  const response = await fetch(`${baseApiUrl}/holidays/`, {
    method: "POST",
    headers: buildHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.msg || "Error al crear la solicitud de vacaciones");
  }
  return data;
};

export const updateHoliday = async (
  token,
  id,
  { start_date, end_date, reason, status } = {}
) => {
  const payload = {};
  if (start_date != null) payload.start_date = start_date;
  if (end_date != null) payload.end_date = end_date;
  if (reason != null) payload.reason = reason;
  if (status != null) payload.status = String(status).toUpperCase();

  const response = await fetch(`${baseApiUrl}/holidays/edit/${id}`, {
    method: "PUT",
    headers: buildHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.msg || "Error al actualizar la solicitud de vacaciones");
  }
  return data;
};

export const deleteHoliday = async (token, id) => {
  const response = await fetch(`${baseApiUrl}/holidays/delete/${id}`, {
    method: "DELETE",
    headers: buildHeaders(token),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.msg || "Error al eliminar la solicitud de vacaciones");
  }
  return data; // { message: "Holiday successfully deleted" }
};

export const approveHoliday = async (token, id) => {
  const response = await fetch(`${baseApiUrl}/holidays/${id}/approve`, {
    method: "POST",
    headers: buildHeaders(token),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.msg || "Error al aprobar la solicitud de vacaciones");
  }
  return data;
};

export const rejectHoliday = async (token, id) => {
  const response = await fetch(`${baseApiUrl}/holidays/${id}/reject`, {
    method: "POST",
    headers: buildHeaders(token),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.msg || "Error al rechazar la solicitud de vacaciones");
  }
  return data;
};

