export const urlApi = import.meta.env.VITE_BACKEND_URL + "/api";

export const getAllEmployees = async () => {
  try {
    const response = await fetch(`${urlApi}/employees`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
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


export const getEmployee = async (id) => {
  try {
    const response = await fetch(`${urlApi}/employees/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.msg || "Error al traer el empleado");
    }
    return data;
  } catch (error) {
    console.error("getEmployee failed:", error);
    throw error;
  }
};


export const createEmployee = async (payload) => {
  try {
    const response = await fetch(`${urlApi}/employees`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.msg || "Error al crear el empleado");
    }
    return data;
  } catch (error) {
    console.error("createEmployee failed:", error);
    throw error;
  }
};


export const editEmployee = async (id, payload) => {
  try {
    const response = await fetch(`${urlApi}/employees/edit/${id}`, {
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
        data.error || data.msg || "Error al actualizar el empleado"
      );
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
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
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

//cloudinary
// export const uploadImge = async (file) => {
//   const formData = new FormData()
//   formData.append("file",file)

//   const response = await fetch(`${urlApi}/employees/upload-img`, {
//     method: "POST",
//     headers: {
//         Authorization: `Bearer ${localStorage.getItem("token")}`,
//       },
//     body: formData
//   })
//   const data =await response.json()
//   return data 
// }