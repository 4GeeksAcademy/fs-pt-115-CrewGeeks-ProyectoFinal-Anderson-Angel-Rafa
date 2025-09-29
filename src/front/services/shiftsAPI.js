// shiftsAPI.js
export const API_BASE = `${import.meta.env.VITE_BACKEND_URL}/api`;

// -------------------- helpers --------------------
export const getAccessToken = (maybeToken) => {
  if (maybeToken && maybeToken !== "undefined" && maybeToken !== "null") return maybeToken;

  const fromLocal = localStorage.getItem("token");
  if (fromLocal && fromLocal !== "undefined" && fromLocal !== "null") return fromLocal;

  const fromSession = sessionStorage.getItem("token");
  if (fromSession && fromSession !== "undefined" && fromSession !== "null") return fromSession;

  return null;
};

export const authHeaders = (maybeToken, extra = {}) => {
  const token = getAccessToken(maybeToken);
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
};

export const handleResponse = async (response) => {
  let data = null;
  try {
    data = await response.json();
  } catch (_) {
    // puede no haber body (204, etc.)
  }
  if (!response.ok) {
    const message = data?.error || data?.msg || response.statusText || "Error de red";
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
};

// Sugerencia: límites del mes (útil para el calendario)
export const monthRange = (d = new Date()) => {
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const pad = (n) => String(n).padStart(2, "0");
  const iso = (x) => `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
  return { from: iso(first), to: iso(last) };
};

// -------------------- Shift Types --------------------
export const getShiftTypes = async (token) => {
  const response = await fetch(`${API_BASE}/shifts/types`, {
    headers: authHeaders(token),
  });
  return handleResponse(response);
};

// -------------------- Shifts (expresos + generados en GET) --------------------
export const listShifts = async ({ from, to, employeeId, token }) => {
  const params = new URLSearchParams({ from, to });
  if (employeeId != null) params.set("employee_id", String(employeeId));
  const response = await fetch(`${API_BASE}/shifts?${params.toString()}`, {
    headers: authHeaders(token),
  });
  return handleResponse(response);
};

export const createShift = async (body, token) => {
  const response = await fetch(`${API_BASE}/shifts`, {
    method: "POST",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  return handleResponse(response);
};

export const updateShift = async (shiftId, body, token) => {
  const response = await fetch(`${API_BASE}/shifts/${shiftId}`, {
    method: "PUT",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  return handleResponse(response);
};

export const deleteShift = async (shiftId, token) => {
  const response = await fetch(`${API_BASE}/shifts/${shiftId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  return handleResponse(response);
};

// -------------------- Series --------------------
export const createSeries = async (body, token) => {
  const response = await fetch(`${API_BASE}/shifts/series`, {
    method: "POST",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  return handleResponse(response);
};

export const listSeries = async ({ employeeId, token }) => {
  const params = new URLSearchParams();
  if (employeeId != null) params.set("employee_id", String(employeeId));
  const response = await fetch(`${API_BASE}/shifts/series?${params.toString()}`, {
    headers: authHeaders(token),
  });
  return handleResponse(response);
};

export const updateSeries = async (seriesId, body, token) => {
  const response = await fetch(`${API_BASE}/shifts/series/${seriesId}`, {
    method: "PUT",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  return handleResponse(response);
};

export const deleteSeries = async (seriesId, token) => {
  const response = await fetch(`${API_BASE}/shifts/series/${seriesId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  return handleResponse(response);
};

// -------------------- Excepciones de Serie --------------------
export const upsertSeriesException = async (seriesId, body, token) => {
  const response = await fetch(`${API_BASE}/shifts/series/${seriesId}/exceptions`, {
    method: "POST",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  return handleResponse(response);
};

export const deleteSeriesExceptionByDate = async (seriesId, dateISO, token) => {
  const params = new URLSearchParams({ date: dateISO });
  const response = await fetch(
    `${API_BASE}/shifts/series/${seriesId}/exceptions?${params.toString()}`,
    {
      method: "DELETE",
      headers: authHeaders(token),
    }
  );
  return handleResponse(response);
};

export const deleteExceptionById = async (exceptionId, token) => {
  const response = await fetch(`${API_BASE}/shifts/exceptions/${exceptionId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  return handleResponse(response);
};

