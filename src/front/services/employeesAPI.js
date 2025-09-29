// employeesAPI.js
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

export const createEmployee = async (payload) => {
  try {
    const response = await fetch(`${urlApi}/employees`, {
      method: "POST",
      headers: {
        ...authHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.msg || "Error al crear el empleado");
    }
    return data; // empleado creado
  } catch (error) {
    console.error("createEmployee failed:", error);
    throw error;
  }
};

export const getAllEmployees = async () => {
  try {
    const response = await fetch(`${urlApi}/employees`, {
      headers: authHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.msg || "Error al traer los empleados");
    }
    return data;
  } catch (error) {
    console.error("getAllEmployees failed:", error);
    throw error;
  }
};

export const editEmployee = async (id, payload) => {
  try {
    const response = await fetch(`${urlApi}/employees/edit/${id}`, {
      method: "PUT",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.msg || "Error al actualizar el empleado");
    }
    return data;
  } catch (error) {
    console.error("editEmployee failed:", error);
    throw error;
  }
};

export const deleteEmployee = async (id) => {
  try {
    const response = await fetch(`${urlApi}/employees/delete/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.msg || "Error al borrar el empleado");
    }
    return data;
  } catch (error) {
    console.error("deleteEmployee failed:", error);
    throw error;
  }
};

// Cloudinary: no establecer Content-Type cuando usas FormData
export const uploadImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${urlApi}/employees/upload-img`, {
      method: "POST",
      headers: authHeaders(), // sin Content-Type
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.msg || "Error al subir la imagen de perfil");
    }
    return data;
  } catch (error) {
    console.error("uploadImage failed:", error);
    throw error;
  }
};

// Alias para no romper imports existentes con el nombre original (typo)
export const uploadImge = uploadImage;
