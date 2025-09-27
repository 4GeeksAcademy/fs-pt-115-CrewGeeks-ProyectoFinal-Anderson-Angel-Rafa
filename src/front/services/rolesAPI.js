// rolesAPI.js
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
export const getAllRoles = async () => {
  try {
    const response = await fetch(`${urlApi}/roles`, {
      headers: authHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.msg || "Error al traer todos los roles");
    }
    return data;
  } catch (error) {
    console.error("getAllRoles failed:", error);
    throw error;
  }
};

export const getRole = async (id) => {
  try {
    const response = await fetch(`${urlApi}/roles/${id}`, {
      headers: authHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.msg || "Error al traer el rol");
    }
    return data;
  } catch (error) {
    console.error("getRole failed:", error);
    throw error;
  }
};

export const createRole = async (payload) => {
  try {
    const response = await fetch(`${urlApi}/roles`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.msg || "Error al crear el rol");
    }
    return data;
  } catch (error) {
    console.error("createRole failed:", error);
    throw error;
  }
};

export const editRole = async (id, payload) => {
  try {
    const response = await fetch(`${urlApi}/roles/edit/${id}`, {
      method: "PUT",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.msg || "Error al actualizar el rol");
    }
    return data;
  } catch (error) {
    console.error("editRole failed:", error);
    throw error;
  }
};

export const deleteRole = async (id) => {
  try {
    const response = await fetch(`${urlApi}/roles/delete/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.msg || "Error al borrar el rol");
    }
    return data;
  } catch (error) {
    console.error("deleteRole failed:", error);
    throw error;
  }
};
