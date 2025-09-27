import { AdminEmpProfile as AdminEmpProfileView } from "../components/AdminEmpProfile/AdminEmpProfile";
import { Sidebar } from "../components/Sidebar/Sidebar";


export const AdminEmpProfile = () => {
  return (
    <div className="app-shell">
        <Sidebar />
        <AdminEmpProfileView  />
    </div>
  );
};