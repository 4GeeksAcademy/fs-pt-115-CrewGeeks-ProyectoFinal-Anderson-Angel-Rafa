import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Lee de localStorage o sessionStorage indistintamente y sanea "undefined"/"null"
  const safeGet = (key) => {
    const v = localStorage.getItem(key) ?? sessionStorage.getItem(key);
    return v && v !== "undefined" && v !== "null" ? v : null;
  };

  const [token, setToken] = useState(safeGet("token"));
  const [refreshToken, setRefreshToken] = useState(safeGet("refresh_token"));

  const urlApi = import.meta.env.VITE_BACKEND_URL + "/api";

  // ---------------- API EXISTENTE ----------------

  const createEmployee = async (payload) => {
    setLoading(true);
    try {
      const response = await fetch(`${urlApi}/employees`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.msg || "Error al crear el empleado");
      setUser(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // 👇 Ahora acepta 2º parámetro opcional { rememberMe }
  const login = async (employeeData, { rememberMe = true } = {}) => {
    setLoading(true);
    try {
      const resp = await fetch(`${urlApi}/employees/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(employeeData),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || data.msg || "Error al hacer login");

      const access = data.token || data.access_token || data.accessToken;
      if (!access) throw new Error("Respuesta de login sin token");
      const refresh = data.refresh_token || data.refreshToken || null;

      // Guarda tokens en el storage según "Recuérdame"
      const store = rememberMe ? localStorage : sessionStorage;
      const other = rememberMe ? sessionStorage : localStorage;

      store.setItem("token", access);
      if (refresh) store.setItem("refresh_token", refresh);

      // limpia el otro para no duplicar
      other.removeItem("token");
      other.removeItem("refresh_token");

      setToken(access);
      if (refresh) setRefreshToken(refresh);
      setUser(data.user || data.employee || null);
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // borra de ambos sitios siempre
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("refresh_token");
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
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}`,
        },
        body: formData, // no pongas Content-Type con FormData
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.msg || "Error al subir la imagen");

      await getEmployeeData();
      return data;
    } catch (e) {
      setError(e.message);
      throw e;
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
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.msg || "Error al eliminar la imagen");
      await getEmployeeData();
      return data;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  // ---------------- REFRESH ACCESS (interno) ----------------

  // Guarda el access en el mismo storage donde esté el refresh
  const setAccessWhereRefreshIs = (newAccess) => {
    if (localStorage.getItem("refresh_token")) {
      localStorage.setItem("token", newAccess);
    } else if (sessionStorage.getItem("refresh_token")) {
      sessionStorage.setItem("token", newAccess);
    } else {
      localStorage.setItem("token", newAccess); // fallback
    }
    setToken(newAccess);
  };

  const refreshAccess = async () => {
    const r = refreshToken || safeGet("refresh_token");
    if (!r) return null;
    try {
      const res = await fetch(`${urlApi}/employees/refresh`, {
        method: "POST",
        headers: { Authorization: `Bearer ${r}` },
      });
      if (!res.ok) {
        logout(); // refresh inválido/expirado → cerrar sesión
        return null;
      }
      const data = await res.json();
      if (data.access_token) {
        setAccessWhereRefreshIs(data.access_token);
        return data.access_token;
      }
      return null;
    } catch {
      return null;
    }
  };

  // ---------------- PERFIL con retry si el access caducó ----------------

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
          // refresh fallido → ya se hizo logout dentro de refreshAccess
          return;
        }
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.msg || "Error al traer el empleado");
      setUser(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      getEmployeeData(); // comportamiento original
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


