const API_BASE = `${import.meta.env.VITE_BACKEND_URL}/api`;

// -------------------- helpers --------------------
const authHeaders = (token) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

const handle = async (res) => {
  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    // sin body
  }
  if (!res.ok) {
    const msg = data?.error || data?.msg || res.statusText || "Error de red";
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
};

// Sugerencia: límites del mes (útil para el calendario)
export const monthRange = (d = new Date()) => {
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const pad = (n) => String(n).padStart(2, "0");
  const iso = (x) =>
    `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
  return { from: iso(first), to: iso(last) };
};

// -------------------- Shift Types --------------------
export const getShiftTypes = async (token) => {
  const res = await fetch(`${API_BASE}/shifts/types`, {
    headers: authHeaders(token),
  });
  return handle(res);
};

// -------------------- Shifts (expresos + generados en GET) --------------------
export const listShifts = async ({ from, to, employeeId, token }) => {
  const params = new URLSearchParams({ from, to });
  if (employeeId != null) params.set("employee_id", String(employeeId));
  const res = await fetch(`${API_BASE}/shifts?${params.toString()}`, {
    headers: authHeaders(token),
  });
  return handle(res);
};

export const createShift = async (body, token) => {
  const res = await fetch(`${API_BASE}/shifts`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  return handle(res);
};

export const updateShift = async (shiftId, body, token) => {
  const res = await fetch(`${API_BASE}/shifts/${shiftId}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  return handle(res);
};

export const deleteShift = async (shiftId, token) => {
  const res = await fetch(`${API_BASE}/shifts/${shiftId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  return handle(res);
};

// -------------------- Series --------------------
export const createSeries = async (body, token) => {
  const res = await fetch(`${API_BASE}/shifts/series`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  return handle(res);
};

export const listSeries = async ({ employeeId, token }) => {
  const params = new URLSearchParams();
  if (employeeId != null) params.set("employee_id", String(employeeId));
  const res = await fetch(`${API_BASE}/shifts/series?${params.toString()}`, {
    headers: authHeaders(token),
  });
  return handle(res);
};

export const updateSeries = async (seriesId, body, token) => {
  const res = await fetch(`${API_BASE}/shifts/series/${seriesId}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  return handle(res);
};

export const deleteSeries = async (seriesId, token) => {
  const res = await fetch(`${API_BASE}/shifts/series/${seriesId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  return handle(res);
};

// -------------------- Excepciones de Serie --------------------
export const upsertSeriesException = async (seriesId, body, token) => {
  const res = await fetch(`${API_BASE}/shifts/series/${seriesId}/exceptions`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  return handle(res);
};

export const deleteSeriesExceptionByDate = async (seriesId, dateISO, token) => {
  const params = new URLSearchParams({ date: dateISO });
  const res = await fetch(
    `${API_BASE}/shifts/series/${seriesId}/exceptions?${params.toString()}`,
    {
      method: "DELETE",
      headers: authHeaders(token),
    }
  );
  return handle(res);
};

export const deleteExceptionById = async (exceptionId, token) => {
  const res = await fetch(`${API_BASE}/shifts/exceptions/${exceptionId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  return handle(res);
};
