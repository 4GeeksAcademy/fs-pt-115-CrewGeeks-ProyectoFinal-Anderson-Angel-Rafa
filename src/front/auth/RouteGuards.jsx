import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"
import { useRole } from "./useRole";
import { roleIsAllowed } from "./roles";

export const RequireAuth = () => {
    const { token, loading } = useAuth();
    const location = useLocation();

    if (loading) return null; //aqui ira loader
    if (!token) return <Navigate to="/login" replace state={{ from: location }} />;
    return <Outlet />;
};

export const RequireRole = ({ roles = [] }) => {
    const { token, loading } = useAuth();
    const { systemRole } = useRole();
    const location = useLocation();

    if (loading) return null;
    if (!token) return <Navigate to="/login" replace state={{ from: location }} />;
    if (!roleIsAllowed(systemRole, roles)) return <Navigate to="/unauthorized" replace />;
    return <Outlet />;
}

export const Unauthorized = () => {
    <div style={{ padding: 24 }}>
        <h1>Acceso denegado</h1>
        <p>No tienes permisos para ver esta página.</p>
    </div>
}