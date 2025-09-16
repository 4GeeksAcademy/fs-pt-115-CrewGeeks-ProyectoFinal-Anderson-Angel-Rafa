import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();
export const AuthProvider = ({ children }) => {

    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [token, setToken] = useState(localStorage.getItem("token") || null)

    const urlApi = import.meta.env.VITE_BACKEND_URL + '/api';


    const createEmployee = async (payload) => {
        setLoading(true)

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
            setUser(data)
        } catch (error) {
            setError(error.message)
        } finally {
            setLoading(false)
        }
    };


    const login = async (employeeData) => {
        setLoading(true)
        try {
            const response = await fetch(`${urlApi}/employees/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(employeeData),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || data.msg || "Error al hacer login");
            }
            localStorage.setItem("token", data.token);
            setToken(data.token)
            setUser(data.user)
        } catch (error) {
            setError(error.message)
        } finally {
            setLoading(false)
        }
    };


    const logout = () => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null)
    }

    const getEmployeeData = async () => {
        setLoading(true)
        try {
            const response = await fetch(`${urlApi}/employees/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || data.msg || "Error al traer el empleado");
            }
            setUser(data)
        } catch (error) {
            setError(error.message)
        } finally {
            setLoading(false)
        }
    };

    useEffect(()=>{
        if(token){
            getEmployeeData()
        }
    },[token])

    return (
        <AuthContext.Provider value={{ user, token, loading, error, createEmployee, login, logout }}>{children}</AuthContext.Provider>
    )

}

export const useAuth = () => {
    return useContext(AuthContext)
}