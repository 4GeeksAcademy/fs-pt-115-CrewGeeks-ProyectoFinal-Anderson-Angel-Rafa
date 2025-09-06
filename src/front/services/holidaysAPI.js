export const urlApi = import.meta.env.VITE_BACKEND_URL + "/api";


export const getAllHolidays = async () => {
    try {
        const response = await fetch(`${urlApi}/holidays`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || data.msg || "Error al traer todas las vacaciones")
        }
        return data;
    } catch (error) {
        console.error("getAllHolidays failed:", error);
        throw error;
    }
}


export const getHollidays = async (id) => {
    try {
        const response = await fetch(`${urlApi}/shifts/${id}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || data.msg || "Error al traer las vacaciones")
        }
        return data;
    } catch (error) {
        console.error("getHollidays failed:", error);
        throw error
    }
}


export const createHollidays = async (payload) => {
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
      throw new Error(data.error || data.msg || "Error al crear las vacaciones");
    }
    return data;
  } catch (error) {
    console.error("createHollidays failed:", error);
    throw error;
  }
};


export const editHollidays = async (id, payload) => {
  try {
    const response = await fetch(`${urlApi}/hollidays/edit/${id}`, {
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
        data.error || data.msg || "Error al actualizar las vacaciones"
      );
    }
    return data;
  } catch (error) {
    console.error("editHollidays failed:", error);
    throw error;
  }
};


export const deleteHollidays = async (id) => {
  try {
    const response = await fetch(`${urlApi}/hollidays/delete/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.msg || "Error al borrar las vacaciones");
    }
    return data;
  } catch (error) {
    console.error("deleteHollidays failed:", error);
    throw error;
  }
};