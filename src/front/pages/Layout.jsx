// Layout.jsx
import { Outlet } from "react-router-dom";
import ScrollToTop from "../components/ScrollToTop";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { Sidebar } from "../components/Sidebar/Sidebar"; // <- nuevo

export const Layout = () => {
  return (
    <ScrollToTop>
      <Navbar />
      <div className="app-shell">
        <aside className="sidebar"><Sidebar /></aside>
        <main className="content"><Outlet /></main>
      </div>
      <Footer />
    </ScrollToTop>
  );
};
