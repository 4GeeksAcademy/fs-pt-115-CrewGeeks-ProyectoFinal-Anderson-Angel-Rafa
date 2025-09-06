export const urlApi = import.meta.env.VITE_BACKEND_URL + "/api";


export const getAllPayrolls = async () => {
    try {
        const response = await fetch(`${urlApi}/payroll`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || data.msg || "Error al traer todas las nominas")
        }
        return data;
    } catch (error) {
        console.error("getAllPayrolls failed:", error);
        throw error;
    }
}


export const getPayroll = async (id) => {
    try {
        const response = await fetch(`${urlApi}/payroll/${id}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || data.msg || "Error al traer la nomina")
        }
        return data;
    } catch (error) {
        console.error("getPayroll failed:", error);
        throw error
    }
}


export const createPayroll = async (payload) => {
  try {
    const response = await fetch(`${urlApi}/payroll`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.msg || "Error al crear la nomina");
    }
    return data;
  } catch (error) {
    console.error("createPayroll failed:", error);
    throw error;
  }
};


export const editPayroll = async (id, payload) => {
  try {
    const response = await fetch(`${urlApi}/payroll/edit/${id}`, {
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
        data.error || data.msg || "Error al actualizar la nomina"
      );
    }
    return data;
  } catch (error) {
    console.error("editPayroll failed:", error);
    throw error;
  }
};


export const deletePayroll = async (id) => {
  try {
    const response = await fetch(`${urlApi}/payroll/delete/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.msg || "Error al borrar la nomina");
    }
    return data;
  } catch (error) {
    console.error("deletePayroll failed:", error);
    throw error;
  }
};