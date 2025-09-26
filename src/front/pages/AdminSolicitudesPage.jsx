import { AdminSolicitudes } from "../components/AdminSolicitudes/AdminSolicitudes";
import { Sidebar } from "../components/Sidebar/Sidebar";


export const AdminSolicitudesPage = () => {
  return (
    <div className="app-shell">
        <Sidebar />
        <AdminSolicitudes />
    </div>
  );
};