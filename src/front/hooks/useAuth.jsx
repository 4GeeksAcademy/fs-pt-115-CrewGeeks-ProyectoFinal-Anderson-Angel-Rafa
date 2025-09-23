import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	// sanea valores del storage
	const safeGet = (key) => {
		const value = localStorage.getItem(key);
		return value && value !== "undefined" && value !== "null" ? value : null;
	};

	const [token, setToken] = useState(safeGet("token") || null);
	const [refreshToken, setRefreshToken] = useState(safeGet("refresh_token") || null);

	const urlApi = import.meta.env.VITE_BACKEND_URL + "/api";

	const createEmployee = async (payload) => {
		setLoading(true);
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
			setUser(data);
		} catch (error) {
			setError(error.message);
		} finally {
			setLoading(false);
		}
	};

	const login = async (employeeData) => {
		setLoading(true);
		try {
			const response = await fetch(`${urlApi}/employees/login`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(employeeData),
			});
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.error || data.msg || "Error al hacer login");
			}

			const access = data.token || data.access_token || data.accessToken;
			if (!access) throw new Error("Respuesta de login sin token");

			localStorage.setItem("token", access);
			setToken(access);

			if (data.refresh_token || data.refreshToken) {
				const r = data.refresh_token || data.refreshToken;
				localStorage.setItem("refresh_token", r);
				setRefreshToken(r);
			}

			setUser(data.user || data.employee || null);
			return true;
		} catch (error) {
			setError(error.message);
			return false;
		} finally {
			setLoading(false);
		}
	};

	const logout = () => {
		localStorage.removeItem("token");
		localStorage.removeItem("refresh_token");
		setToken(null);
		setRefreshToken(null);
		setUser(null);
	};

	const uploadProfileImage = async (file) => {
		if (!file) return;
		setLoading(true);
		setError(null);

		try {
			const formData = new FormData();
			formData.append("file", file); // el backend espera "file"

			const response = await fetch(`${urlApi}/employees/upload-img`, {
				method: "POST",
				headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
				body: formData, // no pongas Content-Type con FormData
			});

			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.error || data.msg || "Error al subir la imagen");
			}

			await getEmployeeData();
			return data; // { msg, imageUrl }
		} catch (error) {
			setError(error.message);
			throw error;
		} finally {
			setLoading(false);
		}
	};

	const deleteProfileImage = async () => {
		setLoading(true);
		setError(null);

		try {
			const response = await fetch(`${urlApi}/employees/delete-img`, {
				method: "DELETE",
				headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
			});

			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.error || data.msg || "Error al eliminar la imagen");
			}

			await getEmployeeData();
			return data; // { msg: "Imagen eliminada correctamente" }
		} catch (error) {
			setError(error.message);
			throw error;
		} finally {
			setLoading(false);
		}
	};

	// ===== refresh de access token (usando /api/employees/refresh) =====
	const refreshAccess = async () => {
		const r = refreshToken || localStorage.getItem("refresh_token");
		if (!r) return null;
		try {
			const res = await fetch(`${urlApi}/employees/refresh`, {
				method: "POST",
				headers: { Authorization: `Bearer ${r}` },
			});
			if (!res.ok) {
				// refresh inválido/expirado → purga todo
				localStorage.removeItem("token");
				localStorage.removeItem("refresh_token");
				setToken(null);
				setRefreshToken(null);
				setUser(null);
				return null;
			}
			const data = await res.json();
			if (data.access_token) {
				localStorage.setItem("token", data.access_token);
				setToken(data.access_token);
				return data.access_token;
			}
			return null;
		} catch {
			return null;
		}
	};

	// ===== perfil con retry si el access caducó =====
	const getEmployeeData = async () => {
		setLoading(true);
		try {
			let response = await fetch(`${urlApi}/employees/profile`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (response.status === 401) {
				const newAccess = await refreshAccess();
				if (newAccess) {
					response = await fetch(`${urlApi}/employees/profile`, {
						headers: { Authorization: `Bearer ${newAccess}` },
					});
				} else {
					// refresh fallido → ya se purgó en refreshAccess
					return;
				}
			}

			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.error || data.msg || "Error al traer el empleado");
			}
			setUser(data);
		} catch (error) {
			setError(error.message);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (token) {
			getEmployeeData(); // mismo comportamiento que tenías
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [token]);

	return (
		<AuthContext.Provider
			value={{
				user,
				token,
				loading,
				error,
				createEmployee,
				login,
				logout,
				uploadProfileImage,
				deleteProfileImage,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => useContext(AuthContext);

