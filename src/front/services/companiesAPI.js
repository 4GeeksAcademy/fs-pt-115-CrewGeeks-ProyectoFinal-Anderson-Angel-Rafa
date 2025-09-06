export const urlApi = import.meta.env.VITE_BACKEND_URL + "/api";


export const getAllCompanies = async () => {
    try {
        const response = await fetch(`${urlApi}/companies`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
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
}


export const getCompany = async (id) => {
    try {
        const response = await fetch(`${urlApi}/companies/${id}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || data.msg || "Error al traer la compañia");
        }
        return data;
    } catch (error) {
        console.error("getCompanie failed:", error);
        throw error;
    }
}


export const createCompany = async (payload) => {
    try {
        const response = await fetch(`${urlApi}/companies`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || data.msg || "Error al crear la compañia");
        }
        return data;
    } catch (error) {
        console.error("createCompany failed:", error);
        throw error;
    }
}


export const updateCompany = async (id, payload) => {
    try {
        const response = await fetch(`${urlApi}/companies/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || data.msg || "Error al modificar la compañia");
        }
        return data;
    } catch (error) {
        console.error("updateCompany failed:", error);
        throw error;
    }
}


export const deleteCompany = async (id) => {
    try {
        const response = await fetch(`${urlApi}/companies/${id}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || data.msg || "Error al borrar la compañia")
        }
        return data;
    } catch (error) {
        console.error("deleteCompany failed:", error);
        throw error;
    }
}