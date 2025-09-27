// suggestionsAPI.js
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

export const getAllSuggestions = async () => {
  try {
    const response = await fetch(`${urlApi}/suggestions`, {
      headers: authHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.msg || "Error al traer todas las sugerencias");
    }
    return data;
  } catch (error) {
    console.error("getAllSuggestions failed:", error);
    throw error;
  }
};

export const getSuggestion = async (id) => {
  try {
    const response = await fetch(`${urlApi}/suggestions/${id}`, {
      headers: authHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.msg || "Error al traer la sugerencia");
    }
    return data;
  } catch (error) {
    console.error("getSuggestion failed:", error);
    throw error;
  }
};

export const createSuggestion = async (payload) => {
  try {
    const response = await fetch(`${urlApi}/suggestions`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.msg || "Error al crear la sugerencia");
    }
    return data;
  } catch (error) {
    console.error("createSuggestion failed:", error);
    throw error;
  }
};

export const updateSuggestion = async (id, payload) => {
  try {
    const response = await fetch(`${urlApi}/suggestions/edit/${id}`, {
      method: "PUT",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.msg || "Error al modificar la sugerencia");
    }
    return data;
  } catch (error) {
    console.error("updateSuggestion failed:", error);
    throw error;
  }
};

export const deleteSuggestion = async (id) => {
  try {
    const response = await fetch(`${urlApi}/suggestions/delete/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });

    if (response.status === 204) return true; // sin body
    const contentType = response.headers.get("content-type") || "";
    const hasJson = contentType.includes("application/json");
    const data = hasJson ? await response.json() : null;

    if (!response.ok) {
      throw new Error((data && (data.error || data.msg)) || "Error al borrar la sugerencia");
    }
    return data ?? true;
  } catch (error) {
    console.error("deleteSuggestion failed:", error);
    throw error;
  }
};
