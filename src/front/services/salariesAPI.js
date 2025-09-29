// salariesAPI.js
export const urlApi = import.meta.env.VITE_BACKEND_URL + "/api";

// Helpers para token y cabeceras
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

// Endpoints
export const getAllSalaries = async () => {
  try {
    const response = await fetch(`${urlApi}/salaries`, {
      headers: authHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.msg || "Error al traer todos los salarios");
    }
    return data;
  } catch (error) {
    console.error("getAllSalaries failed:", error);
    throw error;
  }
};

export const getSalary = async (id) => {
  try {
    const response = await fetch(`${urlApi}/salaries/${id}`, {
      headers: authHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.msg || "Error al traer el salario");
    }
    return data;
  } catch (error) {
    console.error("getSalary failed:", error);
    throw error;
  }
};

export const createSalary = async (payload) => {
  try {
    const response = await fetch(`${urlApi}/salaries`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.msg || "Error al crear el salario");
    }
    return data;
  } catch (error) {
    console.error("createSalary failed:", error);
    throw error;
  }
};

export const editSalary = async (id, payload) => {
  try {
    const response = await fetch(`${urlApi}/salaries/edit/${id}`, {
      method: "PUT",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.msg || "Error al actualizar el salario");
    }
    return data;
  } catch (error) {
    console.error("editSalary failed:", error);
    throw error;
  }
};

export const deleteSalary = async (id) => {
  try {
    const response = await fetch(`${urlApi}/salaries/delete/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.msg || "Error al borrar el salario");
    }
    return data;
  } catch (error) {
    console.error("deleteSalary failed:", error);
    throw error;
  }
};
