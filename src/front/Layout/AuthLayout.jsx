import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Loader } from "../components/Loader/Loader";
import { Navbar } from "../components/Navbar/Navbar";

export const AuthLayout = ({ redirectTo = "/login" }) => {
    const { token, loading, user } = useAuth();
    const location = useLocation();

    // Mientras haces peticiones iniciales puedes enseñar un placeholder si quieres
    if (loading || !user) return <Loader />;

    // La condición buena es por token (lo tienes nada más montar desde localStorage)
    if (!token) return <Navigate to={redirectTo} replace state={{ from: location }} />;

    return (
        <>
        
        <Outlet />
        </>

    );
};