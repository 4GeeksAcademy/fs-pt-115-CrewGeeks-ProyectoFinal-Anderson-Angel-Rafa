// Navbar para usuario logueado
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import "./TopbarLogged.css";
import "../Navbar/Navbar.css";

export const TopbarLogged = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isLanding = location.pathname === "/"

  const fullName =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    user?.email ||
    "Usuario";

  const avatarSrc = user?.image || null;

  return (
    <header className="header-site" role="banner">
      <div className="cg-topbar__inner">
        <div className="cg-brand">
          <Link to="/" >
            <img
              className="cg-logo"
              src="Logotipo.png"
              alt="logotipo"
            />
          </Link>
          <Link to="/" className="cg-brand-name">CrewGeeks</Link>
        </div>

        <nav className="cg-topbar__right" aria-label="Menú de usuario">
          <div className="cg-topbar__user">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={fullName}
                className="cg-topbar__avatar"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="cg-topbar__avatar cg-topbar__avatar--fallback" aria-hidden="true">
                {fullName?.[0]?.toUpperCase() || "U"}
              </span>
            )}
            <span className="cg-topbar__name">{fullName}</span>
          </div>
          {isLanding ? (
            <Link to = "/dashboard">
              <button
                type="button"
                className="cg-btn cg-btn--primary"
                title="Dasboard"
              >Dashboard</button>
            </Link>
          ) : (
            <button
              type="button"
              className="cg-topbar__logout"
              onClick={logout}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <i className="fa-solid fa-right-from-bracket" aria-hidden="true"></i>
              <span className="cg-topbar__logout-text">Salir</span>
            </button>
          )}

        </nav>
      </div>
    </header>
  );
};
