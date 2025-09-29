// Layout.jsx
import { Outlet } from "react-router-dom";
import ScrollToTop from "../components/ScrollToTop";
import { Navbar } from "../components/Navbar/Navbar";
import { useAuth } from "../hooks/useAuth";
import { TopbarLogged } from "../components/TopbarLogged/TopbarLogged";

export const Layout = () => {
  const { token } = useAuth();

  return (
    <ScrollToTop>
      {token ? <TopbarLogged /> : <Navbar />}  
      <Outlet />
    </ScrollToTop>
  );
};
