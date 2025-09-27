// payrollsAPI.js
export const urlApi = import.meta.env.VITE_BACKEND_URL + "/api";

// Helpers locales para token y cabeceras
export const getAccessToken = () => {
  const fromLocal = localStorage.getItem("token");
  if (fromLocal && fromLocal !== "undefined" && fromLocal !== "null") return fromLocal;

  const fromSession = sessionStorage.getItem("token");
  if (fromSession && fromSession !== "undefined" && fromSession !== "null") return fromSession;

  return null;
};

export const authHeaders = (extra = {}) => {
  const token = getAccessToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
};

// Listar todas las nóminas (según permisos del usuario)
export const getAllPayrolls = async () => {
  try {
    const response = await fetch(`${urlApi}/payroll`, {
      headers: authHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.msg || "Error al traer todas las nóminas");
    }
    return data;
  } catch (error) {
    console.error("getAllPayrolls failed:", error);
    throw error;
  }
};

// Obtener una nómina por id
export const getPayroll = async (id) => {
  try {
    const response = await fetch(`${urlApi}/payroll/${id}`, {
      headers: authHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.msg || "Error al traer la nómina");
    }
    return data;
  } catch (error) {
    console.error("getPayroll failed:", error);
    throw error;
  }
};

// Crear nómina
export const createPayroll = async (payload) => {
  try {
    const response = await fetch(`${urlApi}/payroll`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.msg || "Error al crear la nómina");
    }
    return data;
  } catch (error) {
    console.error("createPayroll failed:", error);
    throw error;
  }
};

// Editar nómina
export const editPayroll = async (id, payload) => {
  try {
    const response = await fetch(`${urlApi}/payroll/edit/${id}`, {
      method: "PUT",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.msg || "Error al actualizar la nómina");
    }
    return data;
  } catch (error) {
    console.error("editPayroll failed:", error);
    throw error;
  }
};

// Borrar nómina
export const deletePayroll = async (id) => {
  try {
    const response = await fetch(`${urlApi}/payroll/delete/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.msg || "Error al borrar la nómina");
    }
    return data;
  } catch (error) {
    console.error("deletePayroll failed:", error);
    throw error;
  }
};
