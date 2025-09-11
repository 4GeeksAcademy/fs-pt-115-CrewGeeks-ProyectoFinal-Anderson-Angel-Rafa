// Layout.jsx
import { Outlet } from "react-router-dom";
import ScrollToTop from "../components/ScrollToTop";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";


export const Layout = () => {
  return (
    <ScrollToTop>
      <div className="page">
        <Navbar />
        <main className="page-main">
          <Outlet />
        </main>
        <Footer />
      </div>
    </ScrollToTop>
  );
};
