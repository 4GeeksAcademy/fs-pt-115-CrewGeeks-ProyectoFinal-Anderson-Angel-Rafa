import { AdminRequests } from "../components/AdminRequests/AdminRequests";
import { Sidebar } from "../components/Sidebar/Sidebar";


export const AdminRequestsPage = () => {
  return (
    <div className="app-shell">
      <Sidebar />
      <AdminRequests />
    </div>
  );
};