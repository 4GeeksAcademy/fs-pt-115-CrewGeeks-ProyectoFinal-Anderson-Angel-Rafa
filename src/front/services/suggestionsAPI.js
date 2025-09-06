export const urlApi = import.meta.env.VITE_BACKEND_URL + "/api";


export const getAllSuggestions = async () => {
    try {
        const response = await fetch(`${urlApi}/suggestions`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
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
}


export const getSuggestion = async (id) => {
    try {
        const response = await fetch(`${urlApi}/suggestions/${id}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
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
}


export const createSuggestion = async (payload) => {
    try {
        const response = await fetch(`${urlApi}/suggestions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify(payload)
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
}


export const updateSuggestion = async (id, payload) => {
    try {
        const response = await fetch(`${urlApi}/suggestions/edit/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`
            },
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
}


export const deleteSuggestion = async (id) => {
    try {
        const response = await fetch(`${urlApi}/suggestions/delete/${id}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || data.msg || "Error al borrar la sugerencia")
        }
        return data;
    } catch (error) {
        console.error("deleteSuggestion failed:", error);
        throw error;
    }
}