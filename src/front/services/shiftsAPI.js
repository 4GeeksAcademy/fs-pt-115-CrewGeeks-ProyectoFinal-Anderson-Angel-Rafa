export const urlApi = import.meta.env.VITE_BACKEND_URL + "/api";


export const getAllShifts = async () => {
    try {
        const response = await fetch(`${urlApi}/shifts`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || data.msg || "Error al traer todos los turnos")
        }
        return data;
    } catch (error) {
        console.error("getAllShifts failed:", error);
        throw error;
    }
}


export const getShift = async (id) => {
    try {
        const response = await fetch(`${urlApi}/shifts/${id}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || data.msg || "Error al traer el turno")
        }
        return data;
    } catch (error) {
        console.error("getShift failed:", error);
        throw error
    }
}


export const createShift = async (payload) => {
  try {
    const response = await fetch(`${urlApi}/shifts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.msg || "Error al crear el turno");
    }
    return data;
  } catch (error) {
    console.error("createShift failed:", error);
    throw error;
  }
};


export const editShift = async (id, payload) => {
  try {
    const response = await fetch(`${urlApi}/shifts/edit/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(
        data.error || data.msg || "Error al actualizar el turno"
      );
    }
    return data;
  } catch (error) {
    console.error("editShift failed:", error);
    throw error;
  }
};


export const deleteShift = async (id) => {
  try {
    const response = await fetch(`${urlApi}/shifts/delete/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.msg || "Error al borrar el turno");
    }
    return data;
  } catch (error) {
    console.error("deleteShift failed:", error);
    throw error;
  }
};