// companiesAPI.js
export const urlApi = import.meta.env.VITE_BACKEND_URL + "/api";

// Helpers locales para leer el token de forma segura
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

export const getAllCompanies = async () => {
  try {
    const response = await fetch(`${urlApi}/companies`, {
      headers: authHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.msg || "Error al traer todas las empresas");
    }
    return data;
  } catch (error) {
    console.error("getAllCompanies failed:", error);
    throw error;
  }
};

export const getCompany = async (id) => {
  try {
    const response = await fetch(`${urlApi}/companies/${id}`, {
      headers: authHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.msg || "Error al traer la compañía");
    }
    return data;
  } catch (error) {
    console.error("getCompany failed:", error);
    throw error;
  }
};

export const createCompany = async (payload) => {
  try {
    const response = await fetch(`${urlApi}/companies`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.msg || "Error al crear la compañía");
    }
    return data;
  } catch (error) {
    console.error("createCompany failed:", error);
    throw error;
  }
};

export const updateCompany = async (id, payload) => {
  try {
    const response = await fetch(`${urlApi}/companies/edit/${id}`, {
      method: "PUT",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.msg || "Error al modificar la compañía");
    }
    return data;
  } catch (error) {
    console.error("updateCompany failed:", error);
    throw error;
  }
};

export const deleteCompany = async (id) => {
  try {
    const response = await fetch(`${urlApi}/companies/delete/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.msg || "Error al borrar la compañía");
    }
    return data;
  } catch (error) {
    console.error("deleteCompany failed:", error);
    throw error;
  }
};
