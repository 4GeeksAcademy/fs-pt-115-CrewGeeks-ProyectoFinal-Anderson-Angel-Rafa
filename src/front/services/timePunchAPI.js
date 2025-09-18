const baseUrl = import.meta.env.VITE_BACKEND_URL + "/api/time-punch";

const authHeaders = (token) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

export const getPunchStatus = async (token) => {
  const response = await fetch(`${baseUrl}/status`, {
    headers: authHeaders(token),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || data.msg || "Error al obtener estado");
  return data;
};

export const startShiftApi = async (token, note) => {
  const response = await fetch(`${baseUrl}/start`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(note ? { note } : {}),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || data.msg || "No se pudo iniciar el turno");
  return data; // { ok, punch, idempotent? }
};

export const pauseToggleApi = async (token, note) => {
  const response = await fetch(`${baseUrl}/pause-toggle`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(note ? { note } : {}),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || data.msg || "No se pudo cambiar la pausa");
  return data; // { ok, punch, idempotent? }
};

export const endShiftApi = async (token, note) => {
  const response = await fetch(`${baseUrl}/end`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(note ? { note } : {}),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || data.msg || "No se pudo cerrar el turno");
  return data; // { ok, punches: [...], idempotent? }
};

export const getSummaryApi = async (
  token,
  isoFrom,
  isoTo,
  tz = "Europe/Madrid",
  employeeId
) => {
  const params = new URLSearchParams({ from: isoFrom, to: isoTo, tz });
  if (employeeId) params.set("employee_id", String(employeeId));
  const response = await fetch(`${baseUrl}/summary?${params.toString()}`, {
    headers: authHeaders(token),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || data.msg || "Error al obtener resumen");
  return data; // { days_worked, total_hours, human_total, sessions: [...] }
};

export const getPunchesListApi = async (
  token,
  isoFrom,
  isoTo,
  tz = "Europe/Madrid",
  employeeId
) => {
  const baseUrl = import.meta.env.VITE_BACKEND_URL + "/api/time-punch";
  const params = new URLSearchParams({ from: isoFrom, to: isoTo, tz });
  if (employeeId) params.set("employee_id", String(employeeId));

  const response = await fetch(`${baseUrl}/list?${params.toString()}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || data.msg || "Error al listar fichajes");
  return data; // { employee_id, tz, punches: [{...}] }
};
